document.addEventListener("DOMContentLoaded", async () => {
    // ===================== DOM 元素声明 =====================
    const calendarGrid = document.getElementById("calendar-grid");
    const currentMonthLabel = document.getElementById("current-month");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");
    const eventSidebar = document.getElementById("event-sidebar");
    const closeSidebarBtn = document.getElementById("close-sidebar");
    const saveEventBtn = document.getElementById("save-event");
    const existingEventsDiv = document.getElementById("existing-events");
    const eventTitleInput = document.getElementById("event-title");
    const eventDescriptionInput = document.getElementById("event-description");
    const logoutButton = document.getElementById("logout-button");
    const userButton = document.getElementById("user-button");
    const profileName = document.querySelector(".profile");

    // ===================== 状态变量 =====================
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let selectedDate = null;
    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    let userName = localStorage.getItem("userName") || "Guest";

    // ===================== 用户状态管理 =====================
    if (isLoggedIn) {
        try {
            const response = await fetch("getUser.php", { credentials: "include" });
            const data = await response.json();
            if (data.success) {
                userName = data.user.name;
                localStorage.setItem("userName", userName); // 更新本地存储的用户名
            } else {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userName");
                isLoggedIn = false;
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        }
    }

    // ===================== 初始化 =====================
    updateUI();
    generateCalendar(currentYear, currentMonth);

    // ===================== 事件监听 =====================
    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }
    if (userButton) {
        userButton.addEventListener("click", () => {
            console.log("Redirecting to AuthPage.html...");
            window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
        });
    }
    if (calendarGrid) {
        calendarGrid.addEventListener("click", handleCalendarClick);
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", () => toggleSidebar(false));
    }
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener("click", () => navigateMonth(-1));
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener("click", () => navigateMonth(1));
    }
    if (saveEventBtn) {
        saveEventBtn.addEventListener("click", handleSaveEvent);
    }

    // ===================== 核心功能函数 =====================
    // 更新用户界面状态
    function updateUI() {
        if (profileName) {
            profileName.textContent = userName;
        }
        if (logoutButton) {
            logoutButton.style.display = isLoggedIn ? "inline-block" : "none";
        }
        if (userButton) {
            userButton.style.display = isLoggedIn ? "none" : "inline-block";
        }
    }

    // 生成日历
    function generateCalendar(year, month) {
        if (!calendarGrid || !currentMonthLabel) return;

        calendarGrid.innerHTML = "";
        currentMonthLabel.textContent = new Date(year, month).toLocaleString("en-US", {
            month: "long", 
            year: "numeric"
        });

        // 生成星期标题
        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weekdaysRow = document.createElement("div");
        weekdaysRow.className = "weekdays-row";
        weekdays.forEach(day => {
            weekdaysRow.innerHTML += `<div class="weekday">${day}</div>`;
        });
        calendarGrid.appendChild(weekdaysRow);

        // 生成日期网格
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = document.createElement("div");
        grid.className = "date-grid";

        // 填充空白单元格
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        grid.innerHTML = '<div class="empty"></div>'.repeat(adjustedFirstDay);

        // 生成日期单元格
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayCell = createDayCell(date);
            grid.appendChild(dayCell);
        }

        calendarGrid.appendChild(grid);
    }

    // 创建单个日期单元格
    function createDayCell(date) {
        const dayCell = document.createElement("div");
        dayCell.className = "day";
        dayCell.textContent = date.getDate();
        dayCell.dataset.date = formatDate(date);

        if (isToday(date)) {
            dayCell.classList.add("today");
        }

        // 检查是否有事件并动态更新样式
        checkForEvents(formatDate(date)).then(hasEvents => {
            if (hasEvents) {
                dayCell.classList.add("has-event");

                // 如果日期过期且有事件，添加红色背景
                if (isPastDate(date)) {
                    dayCell.classList.add("past-event");
                }
            }
        });

        return dayCell;
    }

    // 检查某个日期是否有事件
    async function checkForEvents(date) {
        try {
            const response = await fetch(`fetch_events.php?event_date=${date}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            const events = data.events || []; // 默认空数组
            
            return events.length > 0;
        } catch (error) {
            console.error("Error checking events:", error);
            return false;
        }
    }

    // ===================== 事件管理 =====================
    // 打开事件侧边栏
    function openEventSidebar(date) {
        selectedDate = date;
        toggleSidebar(true);
        clearEventInputs();
        loadExistingEvents(date);
    }

    // 加载已有事件
    async function loadExistingEvents(date) {
        if (!existingEventsDiv) return;

        existingEventsDiv.innerHTML = "<p>Loading events...</p>";
        
        try {
            const data = await fetchData(`fetch_events.php?event_date=${date}`);
            renderEvents(data.events);

            // 更新日历上的事件标记
            updateCalendarEventIndicator(date, data.events.length > 0);

            // 检查是否有过期事件并更新样式
            const dayCell = document.querySelector(`.day[data-date="${date}"]`);
            if (dayCell) {
                const hasPastEvent = data.events.some(event => isPastEvent(event.date));
                if (hasPastEvent) {
                    dayCell.classList.add("past-event");
                }
            }
        } catch (error) {
            console.error("Error loading events:", error);
            existingEventsDiv.innerHTML = "<p>Failed to load events</p>";
        }
    }

    // 渲染事件列表
    function renderEvents(events) {
        if (!existingEventsDiv) return;

        existingEventsDiv.innerHTML = events.length ? "" : "<p>No events available</p>";
        
        events.forEach(event => {
            const eventItem = document.createElement("div");
            eventItem.className = `event-item ${isPastEvent(event.date) ? "past-event" : ""}`;
            eventItem.innerHTML = `
                <h4>${event.title}</h4>
                <p>${event.description}</p>
                <button class="delete-btn" data-id="${event.id}">Complete</button>
            `;
            existingEventsDiv.appendChild(eventItem);
        });

        // 为每个 "Complete" 按钮绑定事件监听器
        const deleteButtons = document.querySelectorAll(".delete-btn");
        deleteButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                handleDeleteEvent(button.dataset.id);
            });
        });
    }

    // ===================== 工具函数 =====================
    // 通用数据请求函数
    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error("Network response error");
            return await response.json();
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    }

    // 日期格式化（本地时区）
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 判断是否为今天（本地时区）
    function isToday(date) {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    }

    // 判断是否为过去事件
    function isPastEvent(eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 忽略时间部分
        return new Date(eventDate) < today;
    }

    // 判断日期是否为过去日期
    function isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 忽略时间部分
        return date < today;
    }

    // ===================== 事件处理器 =====================
    // 登出处理
    async function handleLogout(e) {
        e.stopPropagation();
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
    }

    // 日历点击处理
    function handleCalendarClick(e) {
        if (e.target.classList.contains("day")) {
            openEventSidebar(e.target.dataset.date);
        } else if (e.target.classList.contains("delete-btn")) {
            handleDeleteEvent(e.target.dataset.id);
        }
    }

    // 保存事件处理
    async function handleSaveEvent() {
        const title = eventTitleInput.value.trim();
        const description = eventDescriptionInput.value.trim();

        if (!validateEventInputs(title, description)) return;

        try {
            const data = await fetchData("save_event.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    date: selectedDate, 
                    title, 
                    description 
                })
            });

            if (!data.success) throw new Error(data.error || "Failed to save event");

            // 重新加载事件列表
            loadExistingEvents(selectedDate);

            // 更新日历上的事件标记
            updateCalendarEventIndicator(selectedDate, true);

            // 检查是否有过期事件并更新样式
            const dayCell = document.querySelector(`.day[data-date="${selectedDate}"]`);
            if (dayCell) {
                const hasPastEvent = isPastDate(new Date(selectedDate));
                if (hasPastEvent) {
                    dayCell.classList.add("past-event");
                }
            }

            clearEventInputs();
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save event: " + error.message);
        }
    }

    // 删除事件处理
    async function handleDeleteEvent(eventId) {
        console.log("Deleting event with ID:", eventId);
        if (!confirm("Are you COMPLETE the Task?")) return;

        try {
            const parsedEventId = parseInt(eventId, 10);
            if (isNaN(parsedEventId)) {
                throw new Error("Invalid Event ID");
            }

            const requestBody = JSON.stringify({ 
                id: parsedEventId 
            });
            console.log("Request body:", requestBody);

            const response = await fetch("delete_event.php", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: requestBody
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Delete response:", data);

            if (!data.success) {
                throw new Error(data.error || "Failed to delete event");
            }

            // 重新加载事件列表
            loadExistingEvents(selectedDate);

            // 更新日历上的事件标记
            updateCalendarEventIndicator(selectedDate, false);

            // 检查是否有过期事件并更新样式
            const dayCell = document.querySelector(`.day[data-date="${selectedDate}"]`);
            if (dayCell) {
                const hasPastEvent = isPastDate(new Date(selectedDate));
                if (hasPastEvent) {
                    dayCell.classList.remove("past-event");
                }
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete event: " + error.message);
        }
    }

    // ===================== 辅助函数 =====================
    function toggleSidebar(open) {
        if (eventSidebar) {
            eventSidebar.classList.toggle("open", open);
        }
    }

    function clearEventInputs() {
        if (eventTitleInput && eventDescriptionInput) {
            eventTitleInput.value = "";
            eventDescriptionInput.value = "";
        }
    }

    function validateEventInputs(title, description) {
        if (!selectedDate) {
            alert("Please select a date first.");
            return false;
        }
        if (!title || !description) {
            alert("Please fill in both fields.");
            return false;
        }
        return true;
    }

    function navigateMonth(offset) {
        currentMonth += offset;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        selectedDate = null;
        generateCalendar(currentYear, currentMonth);
    }

    function updateCalendarEventIndicator(date, hasEvents) {
        const dayCell = document.querySelector(`.day[data-date="${date}"]`);
        if (dayCell) {
            dayCell.classList.toggle("has-event", hasEvents);
        }
    }
});