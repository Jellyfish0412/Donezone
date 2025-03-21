<?php
header("Content-Type: application/json");
session_start();

try {
    $host = "localhost";
    $user = "root";
    $pass = "";
    $dbname = "calenderdonezone";

    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // 获取 JSON 数据
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    // 检查 `username` 是否存在
    if (!isset($data['username']) || empty(trim($data['username']))) {
        throw new Exception("Invalid or missing username");
    }

    $username = trim($data['username']);

    // 预处理 SQL 查询
    $sql = "SELECT user_id FROM useracc WHERE full_name = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare SQL: " . $conn->error);
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(["success" => false, "error" => "User not found"]);
        exit;
    }

    echo json_encode(["success" => true, "user_id" => $user['user_id']]);

    // 关闭连接
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>