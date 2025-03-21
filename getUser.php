<?php
header("Content-Type: application/json");
session_start();

try {
    $host = "localhost";
    $user = "root";
    $pass = "";
    $dbname = "calenderdonezone";

    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    if (!isset($_SESSION["user_id"])) {
        echo json_encode(["success" => false, "error" => "User not logged in"]);
        exit;
    }

    $userId = $_SESSION["user_id"];

    $sql = "SELECT full_name FROM useracc WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare SQL: " . $conn->error);
    }

    $stmt->bind_param("i", $userId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute SQL: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        throw new Exception("User not found");
    }

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $userId,  // 这里添加 user_id
            "name" => $user["full_name"]
        ]
    ]);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
