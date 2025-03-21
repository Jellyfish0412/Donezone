document.addEventListener("DOMContentLoaded", async () => {
    // ===================== 获取用户信息 =====================
    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    let userName = localStorage.getItem("userName") || "Guest";
    let userId = localStorage.getItem("userId") || null;

    if (isLoggedIn) {
        try {
            const response = await fetch("getUser.php", { credentials: "include" });
            const data = await response.json();
            if (data.success) {
                userName = data.user.name;
                userId = data.user.id;
                localStorage.setItem("userName", userName);
                localStorage.setItem("userId", userId);
            } else {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userName");
                localStorage.removeItem("userId");
                isLoggedIn = false;
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        }
    }

    console.log("User ID:", userId);

    // ===================== API 端点 =====================
    const API_BASE = "http://localhost/RWDD_Assignment/";
    const API = {
        create: API_BASE + "note_create.php",
        get: (userId) => `${API_BASE}note_fetch.php?user_id=${userId}`,
        update: API_BASE + "note_update.php",
        delete: API_BASE + "note_delete.php",
        logout: API_BASE + "logout.php"
    };

    // ===================== DOM 元素 =====================
    const elements = {
        notesContainer: document.getElementById("notesContainer"),
        noteList: document.getElementById("noteList"),
        addNoteBtn: document.getElementById("addNoteBtn"),
        logoutBtn: document.getElementById("logoutBtn"),
        userButton: document.getElementById("user-button"),
        profileName: document.querySelector(".profile"),
        newNoteTitle: document.getElementById("newNoteTitle"),
        confirmCreate: document.getElementById("confirmCreate"),
        closeModal: document.querySelector(".close"),
        titleModal: document.getElementById("titleModal") // 新增模态框元素
    };

    class NoteManager {
        constructor() {
            this.bindEvents();
            this.updateUI();
            if (isLoggedIn) {
                this.loadNotes();
            } else {
                this.showNoNotes();
            }

            // 监听点击外部关闭模态框
            document.addEventListener("click", (event) => {
                const modal = document.getElementById("titleModal");
                const modalContent = modal?.querySelector(".modal-content");

                // 如果点击的目标是模态框外部（背景遮罩）
                if (event.target === modal) {
                    this.toggleModal(false); // 关闭模态框
                }
            });
        }

        bindEvents() {
            // 创建笔记按钮点击事件
            elements.addNoteBtn?.addEventListener("click", () => this.toggleModal(true));

            // 关闭模态框
            elements.closeModal?.addEventListener("click", () => this.toggleModal(false));

            // 确认创建笔记
            elements.confirmCreate?.addEventListener("click", () => this.createNote());

            // 登出按钮
            elements.logoutBtn?.addEventListener("click", () => this.logout());

            // 用户按钮（登录/注册）
            elements.userButton?.addEventListener("click", () => {
                window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
            });

            // 侧边栏点击事件
            elements.noteList?.addEventListener("click", (e) => {
                const noteItem = e.target.closest("li[data-id]");
                if (noteItem) this.showSingleNote(noteItem.dataset.id);
            });

            // 事件委托处理 Save 和 Delete 按钮
            elements.notesContainer?.addEventListener("click", (e) => {
                const button = e.target.closest("button");
                if (!button) return;

                const noteId = button.closest(".note-container")?.dataset.id;
                if (!noteId) return;

                if (button.classList.contains("save-btn")) this.saveNote(noteId);
                else if (button.classList.contains("delete-btn")) this.deleteNote(noteId);
            });
        }

        updateUI() {
            // 更新用户名
            if (elements.profileName) {
                elements.profileName.textContent = userName;
            }

            // 根据登录状态显示/隐藏按钮
            if (elements.logoutBtn) {
                elements.logoutBtn.style.display = isLoggedIn ? "inline-block" : "none";
            }
            if (elements.userButton) {
                elements.userButton.style.display = isLoggedIn ? "none" : "inline-block";
            }
            if (elements.addNoteBtn) {
                elements.addNoteBtn.style.display = isLoggedIn ? "inline-block" : "none";
            }
        }

        async loadNotes() {
            if (!elements.notesContainer) return;
            elements.notesContainer.innerHTML = "<div class='loading'>Loading...</div>";

            const url = API.get(userId);
            const result = await this.fetchData(url);

            if (result?.status === "success") {
                this.renderNotes(result.data);
                this.updateSidebar(result.data);
            } else {
                elements.notesContainer.innerHTML = "<div class='error'>Failed to load notes</div>";
            }
        }

        renderNotes(notes) {
            elements.notesContainer.innerHTML = notes.length
                ? notes.map(note => this.createNoteTemplate(note)).join('')
                : "<div class='empty-state'>No notes found</div>";
        }

        createNoteTemplate(note) {
            return `
                <div class="note-container" data-id="${note.note_id}">
                    <div class="note-header">
                        <h3 contenteditable="true" class="note-title">${NoteManager.escapeHtml(note.note_title)}</h3>
                        <div class="note-actions">
                            <button class="save-btn">Save</button>
                            <button class="delete-btn">Delete</button>
                        </div>
                    </div>
                    <textarea class="note-content">${NoteManager.escapeHtml(note.note_content)}</textarea>
                </div>
            `;
        }

        updateSidebar(notes) {
            if (!elements.noteList) return;

            // 更新侧边栏笔记列表
            elements.noteList.innerHTML = notes.length
                ? notes.map(note => `
                    <li data-id="${note.note_id}">
                        ${NoteManager.escapeHtml(note.note_title)}
                    </li>
                `).join('')
                : "<li>No notes yet</li>";
        }

        showSingleNote(noteId) {
            const allNotes = elements.notesContainer.querySelectorAll(".note-container");
            allNotes.forEach(note => {
                if (note.dataset.id === noteId) {
                    note.style.display = "block"; // 显示点击的笔记
                    const textarea = note.querySelector("textarea");
                    if (textarea) {
                        textarea.classList.add("large-textarea"); // 使用 CSS 类控制样式
                    }
                } else {
                    note.style.display = "none"; // 隐藏其他笔记
                }
            });
        }

        async createNote() {
            const title = elements.newNoteTitle?.value.trim();
            if (!title) return alert("Title is required");

            const result = await this.fetchData(API.create, "POST", {
                user_id: userId,
                note_title: title,
                note_content: ""
            });

            if (result?.status === "success") {
                this.toggleModal(false);
                elements.newNoteTitle.value = '';
                this.loadNotes();
            }
        }

        async saveNote(noteId) {
            const container = document.querySelector(`.note-container[data-id="${noteId}"]`);
            if (!container) return alert("Note not found!");

            const title = container.querySelector(".note-title")?.textContent.trim();
            const content = container.querySelector(".note-content")?.value.trim();
            if (!title) return alert("Title is required");

            const result = await this.fetchData(API.update, "POST", {
                user_id: userId,
                note_id: noteId,
                note_title: title,
                note_content: content
            });

            if (result?.status === "success") {
                alert("Saved Successfully!");
            }
        }

        async deleteNote(noteId) {
            if (!confirm("Are you sure you want to delete this note?")) return;
            const result = await this.fetchData(API.delete, "POST", { note_id: noteId });
            if (result?.status === "success") this.loadNotes();
        }

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
                console.error("Fetch Error:", error);
                alert(`Request failed: ${error.message}`);
                return null;
            }
        }

        toggleModal(show) {
            const modal = document.getElementById("titleModal");
            if (modal) {
                modal.style.display = show ? "flex" : "none";
            }
        }

        async logout() {
            await fetch(API.logout, { method: "POST", credentials: "include" });
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userName");
            localStorage.removeItem("userId");
            window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html";
        }

        static escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    const noteManager = new NoteManager();
});