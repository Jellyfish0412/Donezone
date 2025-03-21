<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['user_id']) || empty($data['note_title'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO note (user_id, note_title, note_content, update_time) 
                          VALUES (:user_id, :note_title, :note_content, NOW())");
    $stmt->execute([
        ':user_id' => $data['user_id'],
        ':note_title' => $data['note_title'],
        ':note_content' => $data['note_content'] ?? ''
    ]);

    echo json_encode([
        'status' => 'success',
        'note_id' => $conn->lastInsertId()
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>