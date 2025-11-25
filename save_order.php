<?php
// save_order.php - Simpan data order ke database MySQL
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
$required = ['orderNumber', 'fullName', 'email', 'phone', 'idNumber', 'quantity', 'total', 'status'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Field '$field' is required"]);
        exit;
    }
}

try {
    // Prepare SQL statement
    $sql = "INSERT INTO orders (
        order_number, 
        full_name, 
        email, 
        phone, 
        id_number, 
        quantity, 
        ticket_price,
        admin_fee,
        total, 
        payment_method,
        status, 
        proof_file_name,
        proof_file_url,
        order_date,
        created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Prepare statement failed: ' . $conn->error);
    }
    
    // Set default values
    $ticketPrice = $data['ticketPrice'] ?? 20000;
    $adminFee = $data['adminFee'] ?? 1000;
    $paymentMethod = $data['paymentMethod'] ?? 'qris';
    $proofFileName = $data['proofFileName'] ?? null;
    $proofFileUrl = $data['proofFileUrl'] ?? null;
    $orderDate = $data['orderDate'] ?? date('Y-m-d H:i:s');
    
    // Bind parameters
    $stmt->bind_param(
        'sssssiisissssss',
        $data['orderNumber'],
        $data['fullName'],
        $data['email'],
        $data['phone'],
        $data['idNumber'],
        $data['quantity'],
        $ticketPrice,
        $adminFee,
        $data['total'],
        $paymentMethod,
        $data['status'],
        $proofFileName,
        $proofFileUrl,
        $orderDate
    );
    
    // Execute query
    if ($stmt->execute()) {
        $orderId = $conn->insert_id;
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Order saved successfully',
            'data' => [
                'orderId' => $orderId,
                'orderNumber' => $data['orderNumber']
            ]
        ]);
    } else {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
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
