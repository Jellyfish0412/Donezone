<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// 数据库配置
$host = 'localhost';
$dbname = 'calenderdonezone';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ✅ 参数验证
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        echo json_encode(["status" => "error", "message" => "需要有效的用户ID"]);
        exit;
    }

    // ✅ 根据你的表结构优化查询
    $stmt = $conn->prepare("
        SELECT 
            c.id AS collaboration_id,
            n.note_id,
            n.note_title
        FROM note_collaborators c
        INNER JOIN note n ON c.note_id = n.note_id
        WHERE c.user_id = :user_id
        ORDER BY c.id DESC
    ");
    
    $stmt->execute([':user_id' => $userId]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ 处理空结果
    if (empty($result)) {
        echo json_encode([
            "status" => "success",
            "data" => [],
            "message" => "暂无协作笔记"
        ]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "data" => $result
    ]);

} catch (PDOException $e) {
    // ✅ 更清晰的错误信息
    $errorInfo = $conn->errorInfo();
    echo json_encode([
        "status" => "error",
        "message" => "数据库操作失败",
        "debug" => [
            "pdo_error" => $e->getMessage(),
            "sql_state" => $errorInfo[0],
            "driver_code" => $errorInfo[1],
            "driver_message" => $errorInfo[2]
        ]
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>