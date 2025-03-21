<?php
session_start();
$user_id = $_SESSION['user_id'] ?? 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DoneZone - Calendar</title>
    <link rel="stylesheet" href="HomePage.css"> <!-- 统一使用主页样式 -->
    <link rel="stylesheet" href="Calendar.css"> <!-- 日历专属样式 -->
    <script src="Calendar.js" defer></script>
</head>
<body>
    <!-- 顶部导航栏 -->
    <div class="header">
        <div class="logo"><img src="img/Donezone Logo.png" alt="DoneZone Logo"></div>
        <div class="auth-buttons">
            <button id="user-button">Login/Register</button>
            <button id="logout-button" style="display: none;">Logout</button>
        </div>
    </div>

    <!-- 主容器 -->
    <div class="container">
        <!-- 左侧边栏 -->
        <div class="sidebar">
            <div class="profile">Guest</div>
            <nav class="menu">
                <a href="HomePage.html">Home</a>
                <a href="Calendar.php" class="active">Calendar</a>
                <a href="Note.html">Page/Note</a>
                <a href="Task.html">Tasks</a>
            </nav>
            <div class="project-section">
                <h3 class="project">My Project</h3>
                <p>None</p>
            </div>
            <!-- 修改后的 Export 部分 -->
            <div class="export-section">
            <h3 class="export">Export</h3>
                <a href="Invite.html">Invite Member</a>
            </div>
        </div>

        <!-- 主内容区域 -->
        <div class="main-content">
            <h1>Calendar</h1>
            <div class="calendar-container">
                <!-- 日历头部 -->
                <div class="calendar-header">
                    <button id="prev-month">&#8249;</button>
                    <span id="current-month"></span>
                    <button id="next-month">&#8250;</button>
                </div>
                <!-- 日历网格 -->
                <div class="calendar-grid" id="calendar-grid"></div>
            </div>
        </div>
    </div>

    <!-- 事件侧边栏 -->
    <div class="event-sidebar" id="event-sidebar">
        <div class="event-header">
            <button id="close-sidebar" class="close-btn">✖</button>
            <h2>Event Manager</h2>
        </div>
        <div class="event-form">
            <input type="text" id="event-title" placeholder="Event Title">
            <textarea id="event-description" placeholder="Event Description"></textarea>
            <br>
            <button id="save-event">Save Event</button>
        </div>
        <div class="event-list">
            <h3>Existing Events</h3>
            <div id="existing-events">
                <p>No events available</p>
            </div>
        </div>
    </div>
</body>
</html>