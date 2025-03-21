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
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取当前用户 ID
    $user_id = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
    if (!$user_id) {
        echo json_encode(["status" => "error", "message" => "User ID missing"]);
        exit;
    }

    error_log("Fetching notes for user ID: " . $user_id); // 记录日志

    // 查询该用户的所有笔记（修正表名：note）
    $sql = "SELECT note_id AS note_id, note_title FROM note WHERE user_id = :user_id";
    error_log("SQL Query: " . $sql); // 记录日志

    $stmt = $conn->prepare($sql);
    $stmt->execute([':user_id' => $user_id]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($notes) {
        echo json_encode(["status" => "success", "data" => $notes]);
    } else {
        echo json_encode(["status" => "no_notes"]);
    }
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage()); // 记录数据库错误
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage()); // 记录其他错误
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
