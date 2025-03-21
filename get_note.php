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
    // 创建数据库连接
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 确保 `note_id` 存在并且是整数
    if (!isset($_GET['note_id']) || !ctype_digit($_GET['note_id'])) {
        http_response_code(400); // Bad Request
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or missing note_id'
        ]);
        exit;
    }
    
    $noteId = (int) $_GET['note_id']; // 强制转换为整数

    // ✅ **改为 `note`，确保表名正确**
    $stmt = $conn->prepare("SELECT note_title, note_content FROM note WHERE note_id = :note_id");
    $stmt->execute([':note_id' => $noteId]);
    $note = $stmt->fetch(PDO::FETCH_ASSOC);

    // 🔍 调试：打印 SQL 查询返回的数据
    file_put_contents("debug_log.txt", print_r($note, true));

    // 返回结果
    if ($note) {
        http_response_code(200); // OK
        echo json_encode([
            'success' => true,
            'note' => [
                'note_title' => htmlspecialchars($note['note_title'], ENT_QUOTES, 'UTF-8'),
                'note_content' => htmlspecialchars($note['note_content'], ENT_QUOTES, 'UTF-8')
            ]
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            'success' => false,
            'message' => 'Note not found'
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred: ' . $e->getMessage()
    ]);
}
?>
