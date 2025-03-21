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

    // 参数验证
    $requiredFields = ['task_id', 'user_id'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            echo json_encode(['status' => 'error', 'message' => "Missing required field: $field"]);
            exit;
        }
    }

    // 构建更新语句
    $updateFields = [];
    if (isset($data['task_title'])) {
        $updateFields[] = "task_title = :task_title";
    }
    if (isset($data['completed'])) {
        $updateFields[] = "completed = :completed";
    }

    if (empty($updateFields)) {
        echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
        exit;
    }

    $sql = "UPDATE task SET ".implode(', ', $updateFields)." 
            WHERE task_id = :task_id AND user_id = :user_id";
    
    $stmt = $conn->prepare($sql);
    
    // 绑定参数
    $params = [
        ':task_id' => $data['task_id'],
        ':user_id' => $data['user_id']
    ];
    
    if (isset($data['task_title'])) {
        $params[':task_title'] = $data['task_title'];
    }
    if (isset($data['completed'])) {
        $params[':completed'] = $data['completed'];
    }

    if ($stmt->execute($params)) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Update failed']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>