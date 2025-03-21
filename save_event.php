<?php
header("Content-Type: application/json");
session_start(); // 确保会话已启动

try {
    // 检查用户是否已登录
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("User not logged in.");
    }
    $userId = $_SESSION['user_id']; // 获取 user_id

    // 连接数据库
    $host = "localhost";
    $user = "root";
    $pass = "";
    $dbname = "calenderdonezone";

    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // 获取 POST 数据
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }

    // 获取字段
    $date = isset($data['date']) ? trim($data['date']) : null;
    $title = isset($data['title']) ? trim($data['title']) : null;
    $description = isset($data['description']) ? trim($data['description']) : null;

    // 验证必填字段
    if (!$date || !$title || !$description) {
        throw new Exception("Missing required fields");
    }

    // 插入数据库（增加 user_id）
    $sql = "INSERT INTO userevents (user_id, event_date, title, description) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare SQL statement: " . $conn->error);
    }

    $stmt->bind_param("isss", $userId, $date, $title, $description);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute SQL statement: " . $stmt->error);
    }

    // 返回成功响应
    echo json_encode(["success" => true]);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    // 捕获所有异常并返回错误信息
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>
