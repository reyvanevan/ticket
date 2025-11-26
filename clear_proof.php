<?php
// clear_proof.php - Delete locally stored proof image and clear DB fields
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$orderNumber = $data['orderNumber'] ?? null;
if (!$orderNumber) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'orderNumber is required']);
    exit;
}

try {
    // Fetch order
    $stmt = $conn->prepare("SELECT proof_file_url FROM orders WHERE order_number = ?");
    $stmt->bind_param('s', $orderNumber);
    $stmt->execute();
    $result = $stmt->get_result();
    $order = $result->fetch_assoc();
    $stmt->close();

    if (!$order) {
        throw new Exception('Order not found');
    }

    $url = $order['proof_file_url'];
    $deleted = false;

    if (!empty($url)) {
        // Convert URL to filesystem path
        // Assumes URL like /assets/uploads/filename.ext
        if (strpos($url, '/assets/uploads/') === 0) {
            $path = __DIR__ . $url; // prepend dir
            if (file_exists($path)) {
                $deleted = unlink($path);
            }
        }
    }

    // Clear DB fields regardless
    $upd = $conn->prepare("UPDATE orders SET proof_file_name = NULL, proof_file_url = NULL, updated_at = NOW() WHERE order_number = ?");
    $upd->bind_param('s', $orderNumber);
    $upd->execute();
    $upd->close();

    echo json_encode([
        'status' => 'success',
        'message' => $deleted ? 'Proof deleted and cleared' : 'Proof cleared (file missing or already deleted)',
        'data' => [
            'orderNumber' => $orderNumber,
            'deleted' => $deleted
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
