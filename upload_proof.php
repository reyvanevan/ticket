<?php
// upload_proof.php - Receive proof of payment image and store locally
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

// Validate file presence
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    exit;
}

// Optional: associate with order number
$orderNumber = $_POST['orderNumber'] ?? null;

$file = $_FILES['file'];

// Validate errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Upload error: ' . $file['error']]);
    exit;
}

// Validate size <= 2MB
$maxSize = 2 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'File too large (max 2MB)']);
    exit;
}

// Validate type
$allowed = ['image/jpeg', 'image/jpg', 'image/png'];
if (!in_array($file['type'], $allowed)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type']);
    exit;
}

// Ensure upload dir exists
$uploadDir = __DIR__ . '/assets/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate safe filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$base = pathinfo($file['name'], PATHINFO_FILENAME);
$safeBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', $base);
$timestamp = date('Ymd_His');
$finalName = $safeBase . '_' . $timestamp . '.' . strtolower($ext);
$destPath = $uploadDir . '/' . $finalName;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save file']);
    exit;
}

// Build public URL (assuming document root)
$publicUrl = '/assets/uploads/' . $finalName;

// If orderNumber provided, update DB record with file info
if ($orderNumber) {
    try {
        $stmt = $conn->prepare("UPDATE orders SET proof_file_name = ?, proof_file_url = ?, updated_at = NOW() WHERE order_number = ?");
        $stmt->bind_param('sss', $finalName, $publicUrl, $orderNumber);
        $stmt->execute();
        $stmt->close();
    } catch (Exception $e) {
        // Non-fatal; still return success with URL
    }
}

echo json_encode([
    'status' => 'success',
    'message' => 'File uploaded',
    'data' => [
        'fileName' => $finalName,
        'fileUrl' => $publicUrl,
        'uploadedAt' => date('c')
    ]
]);

$conn->close();
