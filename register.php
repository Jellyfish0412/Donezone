<?php
header("Content-Type: application/json");

// 启用错误日志（仅用于调试）
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    // 数据库配置
    $host = "localhost";       
    $user = "root";            
    $pass = "";                
    $dbname = "calenderdonezone"; 

    // 连接数据库
    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");

    // 获取 POST 数据
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    // 检查 JSON 数据是否有效
    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid request data");
    }

    // 获取字段
    $fullName = isset($data['full_name']) ? trim($data['full_name']) : null;
    $email = isset($data['email']) ? trim($data['email']) : null;
    $password = isset($data['password']) ? trim($data['password']) : null;

    // 验证必填字段
    if (!$fullName || !$email || !$password) {
        throw new Exception("Full name, email, and password are required");
    }

    // 验证邮箱格式
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // 检查邮箱是否已注册（修正 `id` 为 `user_id`）
    $checkEmailSql = "SELECT user_id FROM useracc WHERE email = ?";
    $checkStmt = $conn->prepare($checkEmailSql);
    if (!$checkStmt) {
        throw new Exception("Failed to prepare SQL statement: " . $conn->error);
    }

    $checkStmt->bind_param("s", $email);
    if (!$checkStmt->execute()) {
        throw new Exception("Failed to execute SQL statement: " . $checkStmt->error);
    }

    $checkResult = $checkStmt->get_result();
    if ($checkResult->num_rows > 0) {
        echo json_encode([
            "success" => false,
            "error" => "Email already registered"
        ]);
        return;
    }

    // **修正 `password` 可能是保留字的问题**
    $insertSql = "INSERT INTO useracc (full_name, email, `password`) VALUES (?, ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    if (!$insertStmt) {
        throw new Exception("Failed to prepare SQL statement: " . $conn->error);
    }

    // 绑定参数
    $insertStmt->bind_param("sss", $fullName, $email, $password);
    if (!$insertStmt->execute()) {
        throw new Exception("Failed to execute SQL statement: " . $insertStmt->error);
    }

    // 返回成功响应
    echo json_encode([
        "success" => true,
        "message" => "Registration successful"
    ]);
} catch (Exception $e) {
    // 捕获所有异常并返回错误信息
    echo json_encode([
        "success" => false,
        "error" => "An error occurred. Please try again later.",
        "debug" => $e->getMessage() // 仅用于调试，生产环境应去掉
    ]);
} finally {
    // 关闭连接
    if (isset($checkStmt)) $checkStmt->close();
    if (isset($insertStmt)) $insertStmt->close();
    if (isset($conn)) $conn->close();
}
?>

