<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

// 数据库配置
$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    // 连接数据库
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取用户ID并验证
    $user_id = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
    if (!$user_id || $user_id <= 0) {
        throw new Exception("Invalid user ID.");
    }

    // 查询笔记数据
    $sql = "SELECT * FROM note WHERE user_id = :user_id ORDER BY update_time DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':user_id' => $user_id]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 返回成功响应
    echo json_encode([
        'status' => 'success',
        'data' => $notes
    ]);
} catch (PDOException $e) {
    // 数据库错误
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // 其他错误
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>