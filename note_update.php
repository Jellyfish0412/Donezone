<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 数据库配置
$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    // 连接数据库
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("SET NAMES utf8mb4");

    // 获取输入数据
    $data = json_decode(file_get_contents("php://input"), true);

    // 验证必需字段
    $required = ['user_id', 'note_id', 'note_title', 'note_content'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            exit(json_encode(['status' => 'error', 'message' => "Missing $field"]));
        }
    }

    // 过滤和验证输入
    $user_id = filter_var($data['user_id'], FILTER_VALIDATE_INT);
    $note_id = filter_var($data['note_id'], FILTER_VALIDATE_INT);
    $note_title = trim($data['note_title']);
    $note_content = trim($data['note_content']);

    // 验证 ID 是否有效
    if (!$user_id || !$note_id || $user_id <= 0 || $note_id <= 0) {
        http_response_code(400);
        exit(json_encode(['status' => 'error', 'message' => 'Invalid ID']));
    }

    // 验证标题长度
    if (empty($note_title) || mb_strlen($note_title) > 255) {
        http_response_code(400);
        exit(json_encode(['status' => 'error', 'message' => 'Title must be between 1 and 255 characters']));
    }

    // 验证内容长度
    if (mb_strlen($note_content) > 10000) {
        http_response_code(400);
        exit(json_encode(['status' => 'error', 'message' => 'Content must be less than 10000 characters']));
    }

    // 验证笔记归属
    $stmt = $conn->prepare("SELECT note_id FROM note WHERE note_id = :note_id AND user_id = :user_id");
    $stmt->execute([':note_id' => $note_id, ':user_id' => $user_id]);
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'message' => 'Permission denied']));
    }

    // 更新笔记
    $stmt = $conn->prepare("UPDATE note SET 
        note_title = :title,
        note_content = :content,
        update_time = NOW()
        WHERE note_id = :note_id
    ");

    $stmt->execute([
        ':title' => $note_title,
        ':content' => $note_content,
        ':note_id' => $note_id
    ]);

    // 返回成功响应
    echo json_encode([
        'status' => 'success',
        'message' => 'Note updated successfully',
        'data' => [
            'note_id' => $note_id,
            'note_title' => $note_title,
            'note_content' => $note_content
        ]
    ]);
} catch (PDOException $e) {
    // 数据库错误
    http_response_code(500);
    error_log("Database error: " . $e->getMessage()); // 记录错误日志
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error'
    ]);
} catch (Exception $e) {
    // 其他错误
    http_response_code(500);
    error_log("Error: " . $e->getMessage()); // 记录错误日志
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>