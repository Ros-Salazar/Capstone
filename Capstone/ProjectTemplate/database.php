<?php
$servername = "localhost";
$username = "ceo_admin"; // Your database username
$password = "adm1n"; // Your database password
$dbname = "test_database"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
