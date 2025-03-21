<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    // 连接数据库
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取输入数据
    $data = json_decode(file_get_contents("php://input"), true);

    // 验证输入数据
    $note_id = filter_var($data['note_id'], FILTER_VALIDATE_INT);
    if ($note_id === false || $note_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid Note ID.']);
        exit;
    }

    // 删除数据
    $sql = "DELETE FROM note WHERE note_id = :note_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':note_id' => $note_id]);

    // 检查是否成功删除
    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Note deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Note not found.']);
    }
} catch (PDOException $e) {
    // 记录错误日志
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Note deletion failed.']);
}
?>