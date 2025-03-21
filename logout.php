<?php
header("Content-Type: application/json");
session_start();

try {
    // 销毁 Session
    session_unset();
    session_destroy();

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>