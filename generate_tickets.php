<?php
// generate_tickets.php - Generate ticket entries for approved orders
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

// Get request data
$input = json_decode(file_get_contents("php://input"), true);
$orderNumber = isset($input['orderNumber']) ? trim($input['orderNumber']) : '';

if (empty($orderNumber)) {
    echo json_encode([
        "status" => "error",
        "message" => "Order number required"
    ]);
    exit;
}

// Get order details
$stmt = $conn->prepare("SELECT id, order_number, full_name, quantity, status FROM orders WHERE order_number = ?");
$stmt->bind_param("s", $orderNumber);
$stmt->execute();
$result = $stmt->get_result();
$order = $result->fetch_assoc();

if (!$order) {
    echo json_encode([
        "status" => "error",
        "message" => "Order not found"
    ]);
    exit;
}

// Check if tickets already generated
$checkStmt = $conn->prepare("SELECT COUNT(*) as ticket_count FROM tickets WHERE order_id = ?");
$checkStmt->bind_param("i", $order['id']);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();
$existing = $checkResult->fetch_assoc();

if ($existing['ticket_count'] > 0) {
    // Tickets already exist, return them
    $getTicketsStmt = $conn->prepare("SELECT ticket_number FROM tickets WHERE order_id = ? ORDER BY id ASC");
    $getTicketsStmt->bind_param("i", $order['id']);
    $getTicketsStmt->execute();
    $ticketsResult = $getTicketsStmt->get_result();
    
    $existingTickets = [];
    while ($row = $ticketsResult->fetch_assoc()) {
        $existingTickets[] = $row['ticket_number'];
    }
    
    echo json_encode([
        "status" => "success",
        "message" => "Tickets already generated",
        "data" => [
            "tickets" => $existingTickets,
            "quantity" => count($existingTickets)
        ]
    ]);
    exit;
}

// Generate ticket numbers
$quantity = (int)$order['quantity'];
$generatedTickets = [];

// Extract date+time from order_number (format: UMB20251126071259)
// Remove 'UMB' prefix, keep the datetime part
$orderSuffix = str_replace('UMB', '', $orderNumber);

$conn->begin_transaction();

try {
    $insertStmt = $conn->prepare("
        INSERT INTO tickets (order_id, ticket_number, ticket_holder_name, status, checked_in)
        VALUES (?, ?, ?, 'active', 0)
    ");
    
    for ($i = 1; $i <= $quantity; $i++) {
        // Format: UMBFEST-20251126071259-001
        $ticketNumber = sprintf("UMBFEST-%s-%03d", $orderSuffix, $i);
        
        $insertStmt->bind_param(
            "iss",
            $order['id'],
            $ticketNumber,
            $order['full_name']
        );
        
        if (!$insertStmt->execute()) {
            throw new Exception("Failed to insert ticket: " . $insertStmt->error);
        }
        
        $generatedTickets[] = $ticketNumber;
    }
    
    $conn->commit();
    
    echo json_encode([
        "status" => "success",
        "message" => "Tickets generated successfully",
        "data" => [
            "tickets" => $generatedTickets,
            "quantity" => count($generatedTickets),
            "order_id" => $order['id']
        ]
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    
    echo json_encode([
        "status" => "error",
        "message" => "Failed to generate tickets: " . $e->getMessage()
    ]);
}

$stmt->close();
$checkStmt->close();
$insertStmt->close();
$conn->close();
?>
