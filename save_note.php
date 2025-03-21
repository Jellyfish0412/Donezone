<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST"); // 允许 POST 方法

// 数据库配置
$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    // 创建数据库连接
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取请求体数据
    $data = json_decode(file_get_contents('php://input'), true);

    // 🔍 调试：记录接收到的数据，防止变量名错误
    file_put_contents("debug_log.txt", print_r($data, true));

    // ✅ 确保字段名正确（应该是 `note_title` 和 `note_content`）
    if (!isset($data['note_id']) || !isset($data['note_title']) || !isset($data['note_content'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: note_id, note_title, or note_content'
        ]);
        exit;
    }

    $noteId = (int)$data['note_id'];
    $title = $data['note_title'];
    $content = $data['note_content'];

    // ✅ **修正 SQL 语句，确保 `note_content` 正确**
    $stmt = $conn->prepare("UPDATE note SET note_title = :title, note_content = :content WHERE note_id = :note_id");
    $stmt->execute([
        ':title' => $title,
        ':content' => $content,
        ':note_id' => $noteId
    ]);

    // ✅ **检查是否真的更新了数据**
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Note updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No changes made or note not found'
        ]);
    }

} catch (PDOException $e) {
    // 捕获数据库错误
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
