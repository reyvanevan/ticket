<?php
// send_ticket_email.php - Trigger n8n webhook untuk kirim email tiket
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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
if (empty($data['nama']) || empty($data['email']) || empty($data['kode_tiket'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Fields "nama", "email", and "kode_tiket" are required'
    ]);
    exit;
}

// N8N Webhook URL - GANTI DENGAN URL PRODUCTION LO!
$n8n_webhook_url = 'https://revy.app.n8n.cloud/webhook/new-order'; // TODO: Update ini!

// Prepare data untuk n8n
$n8n_payload = [
    'nama' => $data['nama'],
    'email' => $data['email'],
    'kode_tiket' => $data['kode_tiket'],
    'order_number' => $data['order_number'] ?? '',
    'quantity' => $data['quantity'] ?? 1,
    'total' => $data['total'] ?? 0,
    'tanggal_event' => '29 November 2025',
    'waktu_event' => '10:00 WIB',
    'lokasi_event' => 'Lapangan Adymic UMbandung'
];

// Initialize cURL
$ch = curl_init($n8n_webhook_url);

// Set cURL options
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($n8n_payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);

curl_close($ch);

// Check response
if ($curl_error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to connect to email service: ' . $curl_error
    ]);
    exit;
}

if ($http_code >= 200 && $http_code < 300) {
    // Success
    echo json_encode([
        'status' => 'success',
        'message' => 'Email sent successfully',
        'n8n_response' => json_decode($response, true)
    ]);
} else {
    // Failed
    http_response_code($http_code);
    echo json_encode([
        'status' => 'error',
        'message' => 'Email service returned error',
        'http_code' => $http_code,
        'response' => $response
    ]);
}
?>
