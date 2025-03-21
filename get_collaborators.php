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

    $note_id = filter_input(INPUT_GET, 'note_id', FILTER_VALIDATE_INT);
    if (!$note_id) {
        throw new Exception("Invalid note ID.");
    }

    // 查询协作成员 Email
    $sql = "SELECT u.email FROM note_collaborators nc 
            JOIN users u ON nc.user_id = u.id 
            WHERE nc.note_id = :note_id";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':note_id' => $note_id]);
    $collaborators = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $collaborators]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
