<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (!isset($_GET['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing user_id']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM task WHERE user_id = :user_id ORDER BY task_id DESC");
    $stmt->execute([':user_id' => $_GET['user_id']]);
    
    echo json_encode(['status' => 'success', 'tasks' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>