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

    // 获取 POST 数据
    $data = json_decode(file_get_contents("php://input"), true);
    $note_id = $data['note_id'] ?? null;
    $user_id = $data['user_id'] ?? null;

    if (!$note_id || !$user_id) {
        throw new Exception("Invalid note ID or user ID.");
    }

    // 删除协作关系
    $deleteSql = "DELETE FROM note_collaborators WHERE note_id = :note_id AND user_id = :user_id";
    $deleteStmt = $conn->prepare($deleteSql);
    $deleteStmt->execute([':note_id' => $note_id, ':user_id' => $user_id]);

    if ($deleteStmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "You have left the note."]);
    } else {
        echo json_encode(["status" => "error", "message" => "No matching record found."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>