<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // 允许跨域请求
header("Access-Control-Allow-Methods: GET");

// 启用错误日志
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'error_log.txt');

try {
    session_start(); // 确保会话已启动

    // ===================== 检查用户是否登录 =====================
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("User not logged in.");
    }
    $userId = $_SESSION['user_id']; // 获取 user_id

    // ===================== 数据库连接 =====================
    $conn = new mysqli("localhost", "root", "", "calenderdonezone");
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // ===================== 获取事件日期 =====================
    if (!isset($_GET['event_date']) || empty($_GET['event_date'])) {
        throw new Exception("Missing event_date parameter.");
    }

    $eventDate = trim($_GET['event_date']);
    

    // 验证日期格式 (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)) {
        throw new Exception("Invalid event_date format. Expected format: YYYY-MM-DD");
    }

    // ===================== 查询用户事件 =====================
    $sql = "SELECT id, title, description FROM userevents WHERE event_date = ? AND user_id = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("SQL prepare failed: " . $conn->error);
    }

    $stmt->bind_param("si", $eventDate, $userId);

    if (!$stmt->execute()) {
        throw new Exception("SQL execute failed: " . $stmt->error);
    }

    // 获取查询结果
    $result = $stmt->get_result();
    $events = [];

    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }

    // ===================== 返回 JSON 数据 =====================
    echo json_encode([
        "success" => true,
        "events" => $events
    ]);
    
    // 关闭数据库连接
    $stmt->close();
    $conn->close();
    exit;
} catch (Exception $e) {
    // 记录错误日志
    error_log("Error in fetch_events.php: " . $e->getMessage());

    // 返回错误信息
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "events" => []
    ]);
    exit;
}
?>
