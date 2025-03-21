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

    if (empty($data['user_id']) || empty($data['task_title'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO task (user_id, task_title, completed) 
                            VALUES (:user_id, :task_title, 0)");
    $stmt->execute([
        ':user_id' => $data['user_id'],
        ':task_title' => $data['task_title']
    ]);

    echo json_encode(['status' => 'success', 'task_id' => $conn->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
