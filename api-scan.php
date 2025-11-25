<?php
// api_scan.php - Ticket Scanner API
// Validates and marks tickets as checked-in
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db.php';

// Get ticket code from request
$input = json_decode(file_get_contents("php://input"), true);
$ticketCode = isset($input['code']) ? trim($input['code']) : '';

if (empty($ticketCode)) {
    echo json_encode([
        "status" => "error", 
        "message" => "Kode tiket tidak terbaca"
    ]);
    exit;
}

// Query ticket with JOIN to orders table
$stmt = $conn->prepare("
    SELECT 
        t.id as ticket_id,
        t.ticket_number,
        t.ticket_holder_name,
        t.status as ticket_status,
        t.checked_in,
        t.checked_in_at,
        o.id as order_id,
        o.order_number,
        o.full_name,
        o.email,
        o.status as order_status
    FROM tickets t
    INNER JOIN orders o ON t.order_id = o.id
    WHERE t.ticket_number = ?
");

$stmt->bind_param("s", $ticketCode);
$stmt->execute();
$result = $stmt->get_result();
$ticket = $result->fetch_assoc();

if (!$ticket) {
    echo json_encode([
        "status" => "error", 
        "message" => "KODE TIKET TIDAK DITEMUKAN!"
    ]);
    exit;
}

// Check order status
if ($ticket['order_status'] !== 'verified') {
    echo json_encode([
        "status" => "error",
        "message" => "Tiket belum diverifikasi! (Status: " . $ticket['order_status'] . ")"
    ]);
    exit;
}

// Check if already checked in
if ($ticket['checked_in']) {
    $checkedInTime = date('d M Y H:i', strtotime($ticket['checked_in_at']));
    echo json_encode([
        "status" => "error",
        "message" => "TIKET SUDAH DIPAKAI!\nDigunakan pada: " . $checkedInTime
    ]);
    exit;
}

// Check ticket status
if ($ticket['ticket_status'] !== 'active') {
    echo json_encode([
        "status" => "error",
        "message" => "Status tiket: " . $ticket['ticket_status']
    ]);
    exit;
}

// ALL VALID - Mark as checked in
$updateStmt = $conn->prepare("
    UPDATE tickets 
    SET checked_in = 1, checked_in_at = NOW() 
    WHERE id = ?
");
$updateStmt->bind_param("i", $ticket['ticket_id']);

if ($updateStmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "✅ TIKET VALID! Silakan Masuk.",
        "data" => [
            "ticket_number" => $ticket['ticket_number'],
            "nama" => $ticket['full_name'],
            "order_number" => $ticket['order_number']
        ]
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Gagal update database: " . $conn->error
    ]);
}

$stmt->close();
$updateStmt->close();
$conn->close();
?>