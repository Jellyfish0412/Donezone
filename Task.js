document.addEventListener("DOMContentLoaded", () => {
    // ===================== Initialization =====================
    const API_BASE = "http://localhost/RWDD_Assignment/";
    const DOM = {
        inProgressList: document.getElementById("inProgressList"),
        tasksContainer: document.getElementById("tasksContainer"),
        addTaskBtn: document.getElementById("addTaskBtn"),
        logoutBtn: document.getElementById("logout-button"),
        userButton: document.getElementById("user-button"), // 添加登录/注册按钮引用
        profileName: document.querySelector(".profile"),
        newTaskTitle: document.getElementById("newTaskTitle"),
        confirmCreateTask: document.getElementById("confirmCreateTask"),
        taskModal: document.getElementById("taskModal"),
        closeModal: document.querySelector(".close"),
        editModal: document.createElement('div')
    };

    // Create Edit Modal
    DOM.editModal.className = 'modal';
    DOM.editModal.innerHTML = `
        <div class="modal-content">
            <span class="close-edit">&times;</span>
            <h2>Edit Task</h2>
            <input type="text" id="editTaskTitle">
            <button id="confirmEditTask">Save Changes</button>
        </div>
    `;
    document.body.appendChild(DOM.editModal);

    // ===================== State Management =====================
    let currentUser = {
        isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
        name: localStorage.getItem("userName") || "Guest",
        id: parseInt(localStorage.getItem("userId")) || null
    };

    // ===================== Core Application Class =====================
    class TodoApp {
        constructor() {
            this.API = {
                create: API_BASE + "task_create.php",
                get: API_BASE + "task_fetch.php",
                update: API_BASE + "task_update.php",
                delete: API_BASE + "task_delete.php",
                logout: API_BASE + "logout.php"
            };

            this.currentEditingTask = null;
            this.init();
        }

        async init() {
            await this.verifySession();
            this.setupUI();
            this.bindEvents();
            this.loadTasks();
        }

        // ===================== User Authentication =====================
        async verifySession() {
            if (!currentUser.isLoggedIn) return this.redirectToLogin();
            
            try {
                const response = await fetch("getUser.php", { 
                    credentials: "include" 
                });
                if (!response.ok) throw new Error("Session verification failed");
                const data = await response.json();
                
                if (!data.success) {
                    this.clearUserData();
                    this.redirectToLogin();
                }
            } catch (error) {
                this.clearUserData();
                this.redirectToLogin();
            }
        }

        // ===================== UI Management =====================
        setupUI() {
            DOM.profileName.textContent = currentUser.name;
            DOM.logoutBtn.style.display = currentUser.isLoggedIn ? "block" : "none";
            DOM.userButton.style.display = currentUser.isLoggedIn ? "none" : "block"; // 控制登录/注册按钮
            DOM.addTaskBtn.style.display = currentUser.isLoggedIn ? "block" : "none";
        }

        // ===================== Event Handling =====================
        bindEvents() {
            // Task Modals
            DOM.addTaskBtn.addEventListener("click", () => this.toggleModal(true));
            DOM.closeModal.addEventListener("click", () => this.toggleModal(false));
            DOM.confirmCreateTask.addEventListener("click", () => this.createTask());
            
            // Edit Modal
            DOM.editModal.querySelector(".close-edit").addEventListener("click", () => this.toggleEditModal(false));
            DOM.editModal.querySelector("#confirmEditTask").addEventListener("click", () => this.updateTaskTitle());
            
            // Background click handling
            window.addEventListener("click", (e) => {
                if (e.target === DOM.taskModal) this.toggleModal(false);
                if (e.target === DOM.editModal) this.toggleEditModal(false);
            });

            // User Actions
            DOM.logoutBtn.addEventListener("click", () => this.logout());
            DOM.userButton.addEventListener("click", () => {
                window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
            });
        }

        // ===================== Task Management =====================
        async loadTasks() {
            try {
                const url = `${this.API.get}?user_id=${currentUser.id}`;
                const response = await this.fetchData(url);
                
                if (response?.status === "success") {
                    this.renderTasks(response.tasks);
                } else {
                    this.showError("Failed to load tasks");
                }
            } catch (error) {
                this.showError("Network error");
            }
        }

        renderTasks(tasks) {
            // Clear existing content
            DOM.inProgressList.innerHTML = "";
            DOM.tasksContainer.innerHTML = "";

            // Render Sidebar (Titles only)
            tasks.filter(t => !t.completed).forEach(task => {
                const sidebarItem = document.createElement("li");
                sidebarItem.className = "sidebar-task";
                sidebarItem.textContent = task.task_title;
                DOM.inProgressList.appendChild(sidebarItem);
            });

            // Render Main Content
            tasks.forEach(task => {
                const taskEl = this.createTaskElement(task);
                DOM.tasksContainer.appendChild(taskEl);
            });
        }

        createTaskElement(task) {
            const taskEl = document.createElement("div");
            taskEl.className = `task-bar ${task.completed ? "completed" : ""}`;
            taskEl.dataset.taskId = task.task_id;
            taskEl.innerHTML = `
                <span class="task-title">${task.task_title}</span>
                <div class="task-controls">
                    <input type="checkbox" class="task-check" ${task.completed ? "checked" : ""}>
                    <button class="btn-edit">Edit</button>
                    <button class="btn-delete">Delete</button>
                </div>
            `;

            // Event Listeners
            taskEl.querySelector(".task-check").addEventListener("change", (e) => 
                this.toggleTaskStatus(task.task_id, e.target.checked)
            );
            
            taskEl.querySelector(".btn-delete").addEventListener("click", () => 
                this.deleteTask(task.task_id)
            );
            
            taskEl.querySelector(".btn-edit").addEventListener("click", () => 
                this.openEditModal(task)
            );

            return taskEl;
        }

        // ===================== Task Operations =====================
        async createTask() {
            const title = DOM.newTaskTitle.value.trim();
            if (!title) return;

            try {
                const response = await this.fetchData(this.API.create, "POST", {
                    user_id: currentUser.id,
                    task_title: title
                });

                if (response?.status === "success") {
                    this.toggleModal(false);
                    DOM.newTaskTitle.value = "";
                    this.loadTasks();
                }
            } catch (error) {
                this.showError("Failed to create task");
            }
        }

        async deleteTask(taskId) {
            if (!confirm("Are you sure you want to delete this task?")) return;
            
            try {
                await this.fetchData(this.API.delete, "POST", {
                    task_id: taskId,
                    user_id: currentUser.id
                });
                this.loadTasks();
            } catch (error) {
                this.showError("Failed to delete task");
            }
        }

        async toggleTaskStatus(taskId, completed) {
            try {
                await this.fetchData(this.API.update, "POST", {
                    task_id: taskId,
                    user_id: currentUser.id,
                    completed: completed ? 1 : 0
                });
                this.loadTasks();
            } catch (error) {
                this.showError("Failed to update status");
            }
        }

        // ===================== Edit Functionality =====================
        openEditModal(task) {
            this.currentEditingTask = task.task_id;
            document.getElementById("editTaskTitle").value = task.task_title;
            DOM.editModal.style.display = "flex";
        }

        toggleEditModal(show = true) {
            DOM.editModal.style.display = show ? "flex" : "none";
        }

        async updateTaskTitle() {
            const newTitle = document.getElementById("editTaskTitle").value.trim();
            if (!newTitle) {
                this.showError("Title cannot be empty");
                return;
            }

            try {
                const response = await this.fetchData(this.API.update, "POST", {
                    task_id: this.currentEditingTask,
                    user_id: currentUser.id,
                    task_title: newTitle
                });

                if (response?.status === "success") {
                    this.toggleEditModal(false);
                    this.loadTasks();
                }
            } catch (error) {
                this.showError("Failed to update task");
            }
        }

        // ===================== Helper Methods =====================
        toggleModal(show = true) {
            DOM.taskModal.style.display = show ? "flex" : "none";
            if (!show) DOM.newTaskTitle.value = "";
        }

        showError(message) {
            const errorEl = document.createElement("div");
            errorEl.className = "error-message";
            errorEl.textContent = message;
            
            DOM.tasksContainer.prepend(errorEl);
            setTimeout(() => errorEl.remove(), 3000);
        }

        clearUserData() {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userName");
            localStorage.removeItem("userId");
        }

        redirectToLogin() {
            window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
        }

        async logout() {
            await fetch(this.API.logout, { 
                method: "POST", 
                credentials: "include" 
            });
            this.clearUserData();
            this.redirectToLogin();
        }

        // ===================== API Communication =====================
        async fetchData(url, method = "GET", data = null) {
            try {
                const options = {
                    method,
                    headers: { "Content-Type": "application/json" },
                    credentials: "include"
                };
                
                if (data) options.body = JSON.stringify(data);
                
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                return await response.json();
            } catch (error) {
                console.error("Request failed:", error);
                throw error;
            }
        }
    }

    // Initialize application
    new TodoApp();
});