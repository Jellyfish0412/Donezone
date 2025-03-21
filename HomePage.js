document.addEventListener("DOMContentLoaded", async () => {
    const logoutButton = document.getElementById("logout-button");
    const userButton = document.getElementById("user-button");
    const profileName = document.querySelector(".profile");

    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    let userName = localStorage.getItem("userName") || "Guest";

    if (isLoggedIn) {
        try {
            const response = await fetch("getUser.php", { credentials: "include" });
            const data = await response.json();
            if (data.success) {
                userName = data.user.name;
            } else {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userName");
                isLoggedIn = false;
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        }
    }

    updateUI();

    // 添加点击事件：跳转到登录页面
    userButton.addEventListener("click", () => {
        console.log("Redirecting to AuthPage.html...");
        window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
    });

    // 处理 Logout 按钮点击
    logoutButton.addEventListener("click", async (e) => {
        if (confirm("Are you sure you want to logout?")) {
            try {
                await fetch("logout.php", { method: "POST", credentials: "include" });
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userName");
                console.log("Redirecting to AuthPage.html...");
                window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
            } catch (error) {
                console.error("Logout failed:", error);
            }
        }
    });

    // 更新 UI 的函数
    function updateUI() {
        profileName.textContent = userName;
        logoutButton.style.display = isLoggedIn ? "inline-block" : "none"; // 登录后显示 Logout 按钮
        userButton.style.display = isLoggedIn ? "none" : "inline-block"; // 未登录时显示 Login/Register 按钮
    }
});