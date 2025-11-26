<?php
// get_orders.php - Get all orders from database for admin panel
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Optional filter by status
$status = $_GET['status'] ?? null;

try {
    // Build query
    $sql = "SELECT * FROM orders";
    
    if ($status && $status !== 'all') {
        $sql .= " WHERE status = ?";
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    // Prepare statement
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Prepare statement failed: ' . $conn->error);
    }
    
    // Bind parameter if filtering
    if ($status && $status !== 'all') {
        $stmt->bind_param('s', $status);
    }
    
    // Execute query
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Fetch all orders
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        // Format order data untuk frontend
        $orders[] = [
            'id' => $row['id'],
            'orderNumber' => $row['order_number'],
            'buyer' => [
                'fullName' => $row['full_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'idNumber' => $row['id_number']
            ],
            'quantity' => (int)$row['quantity'],
            'ticketPrice' => (int)$row['ticket_price'],
            'adminFee' => (int)$row['admin_fee'],
            'total' => (int)$row['total'],
            'paymentMethod' => $row['payment_method'],
            'status' => $row['status'],
            'proofUploaded' => (!empty($row['proof_file_url']) || !empty($row['proof_file_name'])),
            'proofFileName' => $row['proof_file_name'],
            'proofFileUrl' => $row['proof_file_url'],
            'orderDate' => $row['order_date'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }
    
    // Calculate statistics
    $stats = [
        'total' => count($orders),
        'waiting' => 0,
        'verified' => 0,
        'revenue' => 0
    ];
    
    foreach ($orders as $order) {
        if ($order['status'] === 'waiting_verification') {
            $stats['waiting']++;
        } elseif ($order['status'] === 'verified') {
            $stats['verified']++;
            $stats['revenue'] += $order['total'];
        }
    }
    
    // Return response
    echo json_encode([
        'status' => 'success',
        'data' => [
            'orders' => $orders,
            'statistics' => $stats
        ]
    ]);
    
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
