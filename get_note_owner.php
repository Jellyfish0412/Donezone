<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// 数据库配置
$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ✅ 参数接收优化
    $note_id = isset($_GET['note_id']) ? (int)$_GET['note_id'] : 0;
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    // ✅ 灵活校验逻辑
    if ($note_id < 1) {
        echo json_encode(["status" => "error", "message" => "Invalid note ID"]);
        exit;
    }

    // ✅ 使用预处理语句防止SQL注入
    $stmt = $conn->prepare("SELECT user_id FROM note WHERE note_id = :note_id");
    $stmt->execute([':note_id' => $note_id]);
    $note = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$note) {
        echo json_encode(["status" => "error", "message" => "Note not found"]);
        exit;
    }

    // ✅ 优化协作检查查询
    $stmt = $conn->prepare("
        SELECT 1 
        FROM note_collaborators 
        WHERE note_id = :note_id 
        AND user_id = :user_id
        LIMIT 1
    ");
    $stmt->execute([':note_id' => $note_id, ':user_id' => $user_id]);

    echo json_encode([
        "status" => "success",
        "owner_id" => (int)$note['user_id'],
        "is_owner" => ((int)$note['user_id'] === $user_id),
        "is_collaborator" => ($stmt->rowCount() > 0)
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error", 
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>