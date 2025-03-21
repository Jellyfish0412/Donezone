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

    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    if (!$data) {
        throw new Exception("Invalid request data");
    }

    $email = trim($data['email']);
    $password = trim($data['password']);

    if (!$email || !$password) {
        throw new Exception("Email and password are required");
    }

    $sql = "SELECT user_id, full_name, email, password FROM useracc WHERE email = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare SQL: " . $conn->error);
    }

    $stmt->bind_param("s", $email);
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute SQL: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(["success" => false, "error" => "Invalid email"]);
        exit;
    }

    if ($password !== $user['password']) {
        echo json_encode(["success" => false, "error" => "Invalid password"]);
        exit;
    }

    // 设置 Session
    $_SESSION["user_id"] = $user['user_id'];

    echo json_encode([
        "success" => true,
        "user" => [
            "name" => $user['full_name'],
            "email" => $user['email']
        ]
    ]);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>