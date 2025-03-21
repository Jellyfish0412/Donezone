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

    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['task_id']) || empty($data['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM task WHERE task_id = :task_id AND user_id = :user_id");
    $stmt->execute([
        ':task_id' => $data['task_id'],
        ':user_id' => $data['user_id']
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Task deleted']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
