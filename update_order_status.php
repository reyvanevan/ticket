<?php
// update_order_status.php - Update order status (approve/reject) by admin
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
if (empty($data['orderNumber']) || empty($data['status'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Fields "orderNumber" and "status" are required'
    ]);
    exit;
}

// Validate status
$allowedStatuses = ['verified', 'rejected'];
if (!in_array($data['status'], $allowedStatuses)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid status. Allowed: verified, rejected'
    ]);
    exit;
}

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Get order details
    $sql = "SELECT * FROM orders WHERE order_number = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $data['orderNumber']);
    $stmt->execute();
    $result = $stmt->get_result();
    $order = $result->fetch_assoc();
    
    if (!$order) {
        throw new Exception('Order not found');
    }
    
    // Update order status
    $updateSql = "UPDATE orders SET status = ?, updated_at = NOW() WHERE order_number = ?";
    $updateStmt = $conn->prepare($updateSql);
    $newStatus = $data['status'];
    $orderNumber = $data['orderNumber'];
    $updateStmt->bind_param('ss', $newStatus, $orderNumber);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Failed to update order status');
    }
    
    // Log verification action
    $logSql = "INSERT INTO verification_logs (order_id, admin_name, action, notes, created_at) 
               VALUES (?, ?, ?, ?, NOW())";
    $logStmt = $conn->prepare($logSql);
    
    $adminName = $data['adminName'] ?? 'Admin';
    $action = $data['status'] === 'verified' ? 'APPROVED' : 'REJECTED';
    $notes = $data['notes'] ?? $data['rejectionReason'] ?? '';
    
    $logStmt->bind_param('isss', $order['id'], $adminName, $action, $notes);
    $logStmt->execute();
    
    // Commit transaction
    $conn->commit();
    
    // EMAIL SENDING REMOVED FROM SERVER-SIDE
    // Email will be sent by admin.js from client-side JavaScript
    // This avoids InfinityFree cURL blocking issues
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => $data['status'] === 'verified' ? 
            'Order approved successfully' : 
            'Order rejected successfully',
        'data' => [
            'orderNumber' => $data['orderNumber'],
            'newStatus' => $data['status']
        ]
    ]);
    
    $stmt->close();
    $updateStmt->close();
    $logStmt->close();
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
