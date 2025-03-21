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

    // 获取 `note_id` 和 `email`
    $note_id = filter_input(INPUT_POST, 'note_id', FILTER_VALIDATE_INT);
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL); // 这里使用 `FILTER_VALIDATE_EMAIL`

    if (!$note_id || !$email) {
        echo json_encode(["status" => "error", "message" => "Invalid note ID or email."]);
        exit;
    }

    error_log("Invite request: note_id = $note_id, email = $email");

    // 通过 Email 查找 `user_id`
    $stmt = $conn->prepare("SELECT user_id FROM useracc WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        error_log("User not found for email: $email");
        echo json_encode(["status" => "not_found"]);
        exit;
    }

    $user_id = $user['user_id'];
    error_log("Found user_id: $user_id for email: $email");

    // 检查用户是否已被邀请
    $checkStmt = $conn->prepare("SELECT id FROM note_collaborators WHERE note_id = :note_id AND user_id = :user_id");
    $checkStmt->execute([':note_id' => $note_id, ':user_id' => $user_id]);

    if ($checkStmt->rowCount() > 0) {
        error_log("User $user_id already invited to note $note_id");
        echo json_encode(["status" => "exists"]);
        exit;
    }

    // 添加到 `note_collaborators`
    $insertStmt = $conn->prepare("INSERT INTO note_collaborators (note_id, user_id) VALUES (:note_id, :user_id)");
    $insertStmt->execute([':note_id' => $note_id, ':user_id' => $user_id]);

    error_log("User $user_id added as collaborator to note $note_id");
    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
