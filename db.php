<?php
// db.php
$host = "sql103.infinityfree.com"; // Ganti MySQL Host Name
$user = "if0_40506185";            // Ganti MySQL User Name
$pass = "reyvansanusi712";             // Ganti MySQL Password (password akun hosting)
$db   = "if0_40506185_umbfest";      // Ganti MySQL DB Name

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Koneksi Gagal: " . $conn->connect_error]));
}
?>