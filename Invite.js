document.addEventListener("DOMContentLoaded", () => {
    // ⚙️ 配置常量
    const CONFIG = {
        MAX_RETRY: 3,
        RETRY_DELAY: 2000,
        ALERT_DURATION: 5000
    };

    // 🖥️ DOM元素引用
    const DOM = {
        logoutButton: document.getElementById("logout-button"),
        userButton: document.getElementById("user-button"),
        profileName: document.querySelector(".profile"),
        inviteModal: document.getElementById("inviteModal"),
        inviteUserInput: document.getElementById("inviteUserInput"),
        inviteUserBtn: document.getElementById("inviteUserBtn"),
        noteList: document.getElementById("noteList"),
        leaveNoteBtn: document.getElementById("leaveNoteBtn"),
        editModal: document.getElementById("editModal"),
        editTitle: document.getElementById("editTitle"),
        editContent: document.getElementById("editContent"),
        saveNoteBtn: document.getElementById("saveNoteBtn")
    };

    // 🔒 应用状态
    const state = {
        isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
        userId: parseInt(localStorage.getItem("userId")) || null,
        currentNote: {
            id: null,
            title: ""
        },
        retryCount: 0
    };

    // 🛠️ 工具方法
    const utils = {
        showAlert: (message, type = "info") => {
            const alert = document.createElement("div");
            alert.className = `alert ${type} animate-fade-in`;
            alert.innerHTML = `
                <span>${message}</span>
                <button class="close-alert">&times;</button>
            `;

            alert.querySelector(".close-alert").addEventListener("click", () => {
                alert.remove();
            });

            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), CONFIG.ALERT_DURATION);
        },

        validateEmail: (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        sanitizeInput: (str) => {
            return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },

        closeModal: (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = "none";
        }
    };

    // 🌐 API服务
    const apiService = {
        fetch: async (url, options = {}) => {
            try {
                const response = await fetch(url, {
                    credentials: "include",
                    ...options
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error("API Request Failed:", error);
                return { status: "error", message: error.message };
            }
        },

        getUserSession: async () => {
            return apiService.fetch("getUser.php");
        },

        fetchNotes: async (userId) => {
            return Promise.all([
                apiService.fetch(`note_fetch.php?user_id=${userId}`),
                apiService.fetch(`fetch_collaborate_note.php?user_id=${userId}`)
            ]);
        },

        getNoteDetails: async (noteId) => {
            return apiService.fetch(`get_note.php?note_id=${noteId}`);
        },

        saveNote: async (noteData) => {
            return apiService.fetch("save_note.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteData)
            });
        },

        inviteUser: async (noteId, email, inviterId) => {
            return apiService.fetch("invite.php", {
                method: "POST",
                body: new URLSearchParams({
                    note_id: noteId,
                    email: email,
                    inviter_id: inviterId
                })
            });
        },

        leaveCollaborator: async (noteId, userId) => {
            return apiService.fetch("leave_collaborator.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    note_id: noteId,
                    user_id: userId
                })
            });
        }
    };

    // � 业务逻辑
    const actions = {
        initializeSession: async () => {
            if (!state.isLoggedIn) return;

            try {
                const data = await apiService.getUserSession();
                if (data.success) {
                    state.userId = parseInt(data.user.id);
                    localStorage.setItem("userId", state.userId);
                    localStorage.setItem("isLoggedIn", "true");
                    DOM.profileName.textContent = data.user.name;
                } else {
                    actions.clearSession();
                }
            } catch (error) {
                if (state.retryCount++ < CONFIG.MAX_RETRY) {
                    setTimeout(actions.initializeSession, CONFIG.RETRY_DELAY);
                } else {
                    utils.showAlert("Connection failed. Please check your network.", "error");
                }
            }
        },

        logout: async () => {
            console.log("[DEBUG] Logging out...");
            try {
                await fetch("logout.php", { method: "POST", credentials: "include" });
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userName");
                localStorage.removeItem("userId");
                window.location.href = "http://localhost/RWDD_Assignment/AuthPage.html"; // 你的登录页面
            } catch (error) {
                console.error("[ERROR] Logout failed:", error);
            }
        },

        loadNotes: async () => {
            if (!state.userId) return;

            try {
                const [userNotes, collabNotes] = await apiService.fetchNotes(state.userId);
                const mergedNotes = [
                    ...(userNotes.data || []).map(n => ({ ...n, isOwner: true })),
                    ...(collabNotes.data || []).map(n => ({ ...n, isOwner: false }))
                ];
                actions.renderNotes(mergedNotes);
            } catch (error) {
                utils.showAlert("Failed to load notes. Please try again.", "error");
            }
        },

        renderNotes: (notes) => {
            DOM.noteList.innerHTML = notes.length ? notes.map(note => {
                const sanitizedTitle = utils.sanitizeInput(note.note_title);
                return `
                    <div class="note-item" data-note-id="${note.note_id}">
                        <span>${sanitizedTitle}</span>
                        <div class="button-group">
                            ${note.isOwner ? `
                                <button class="invite-btn" 
                                    data-note-id="${note.note_id}"
                                    data-testid="invite-btn-${note.note_id}">
                                    Invite
                                </button>
                            ` : ''}
                            <button class="edit-btn" data-note-id="${note.note_id}">Edit</button>
                            ${!note.isOwner ? `
                                <button class="leave-btn" data-note-id="${note.note_id}">Leave</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('') : '<p class="empty-state">No notes available. Create one to get started!</p>';
            
        },

        handleInvite: async (noteId) => {
            const numericId = parseInt(noteId);
            if (!numericId) return;

            try {
                const permissionCheck = await apiService.fetch(
                    `get_note_owner.php?note_id=${numericId}&user_id=${state.userId}`
                );

                if (!permissionCheck.is_owner) {
                    utils.showAlert("You don't have permission to invite collaborators", "warning");
                    return;
                }

                state.currentNote.id = numericId;
                DOM.inviteModal.style.display = "flex"; // 显示邀请模态框
            } catch (error) {
                utils.showAlert("Failed to load note details", "error");
            }
        },

        handleEdit: async (noteId) => {
            try {
                console.log('[DEBUG] Editing Note ID:', noteId);

                if (!noteId) {
                    throw new Error("Invalid note ID");
                }

                const data = await apiService.getNoteDetails(noteId);
                console.log('[DEBUG] API Response:', data); // 🔍 调试 API 返回内容

                if (!data.success) {
                    throw new Error(data.message || "Failed to load note");
                }

                if (!data.note || !data.note.note_title) {
                    throw new Error("Received incomplete note data");
                }

                // ✅ 直接填充 `readonly` 的 `title`
                DOM.editTitle.value = utils.sanitizeInput(data.note.note_title);

                // ✅ 允许用户修改内容
                DOM.editContent.value = utils.sanitizeInput(data.note.note_content || "");

                // ✅ 存入 state，防止 `saveNote()` 取不到值
                state.currentNote.id = parseInt(noteId);
                state.currentNote.title = data.note.note_title;

                console.log("[DEBUG] Updated state:", state.currentNote); // 🔍 确保 state 被正确更新

                DOM.editModal.style.display = "flex";
            } catch (error) {
                console.error('[ERROR] Failed to load note content:', error);
                utils.showAlert("Failed to load note content. Please try again.", "error");
            }
        },

        saveNote: async () => {
            const noteData = {
                note_id: state.currentNote.id,
                note_title: state.currentNote.title, // ✅ 直接从 `state` 取，保证和数据库一致
                note_content: DOM.editContent.value.trim() // ✅ 确保 `note_content` 正确
            };

            console.log("[DEBUG] Final note data before sending:", noteData);

            if (!noteData.note_id || !noteData.note_title || !noteData.note_content) {
                console.error("[ERROR] Missing required fields:", noteData);
                utils.showAlert("Missing required fields. Please fill in all fields.", "error");
                return;
            }

            try {
                const result = await apiService.saveNote(noteData);
                console.log("[DEBUG] API Response after saving:", result);

                if (result.success) {
                    utils.showAlert("Note saved successfully!", "success");
                    DOM.editModal.style.display = "none";
                } else {
                    throw new Error(result.message || "Failed to save note");
                }
            } catch (error) {
                console.error("[ERROR] Failed to save note:", error);
                utils.showAlert("Failed to save note changes", "error");
            }
        },

        clearSession: () => {
            localStorage.clear();
            state.isLoggedIn = false;
            state.userId = null;
            DOM.profileName.textContent = "Guest";
            DOM.noteList.innerHTML = "";
        },

        handleLeaveNote: async (noteId) => {
            if (!confirm("Are you sure you want to leave this note?")) return;
        
            try {
                console.log("[DEBUG] Leaving note:", noteId, "User ID:", state.userId); // 调试日志
        
                if (!noteId || !state.userId) {
                    throw new Error("Invalid note ID or user ID.");
                }
        
                const result = await apiService.leaveCollaborator(noteId, state.userId);
                console.log("[DEBUG] API Response:", result); // 调试日志
        
                if (result.status === "success") {
                    utils.showAlert("You have left the note.", "success");
                    actions.loadNotes(); // 刷新笔记列表
                } else {
                    throw new Error(result.message || "Failed to leave note");
                }
            } catch (error) {
                console.error("[ERROR] Failed to leave note:", error);
                utils.showAlert("Failed to leave note. Please try again.", "error");
            }
        }
    };

    // 🖱️ 事件处理
    const setupEventListeners = () => {
        // 笔记列表点击处理
        DOM.noteList.addEventListener("click", (e) => {
            const noteId = e.target.dataset.noteId;
            if (!noteId) return;

            if (e.target.classList.contains("invite-btn")) {
                actions.handleInvite(noteId);
            } else if (e.target.classList.contains("edit-btn")) {
                actions.handleEdit(noteId);
            } else if (e.target.classList.contains("leave-btn")) {
                actions.handleLeaveNote(noteId);
            }
        });

        DOM.logoutButton.addEventListener("click", async () => {
            console.log("[DEBUG] Logout button clicked");
            await actions.logout();
        });

        // 邀请表单提交
        DOM.inviteUserBtn.addEventListener("click", async () => {
            const email = DOM.inviteUserInput.value.trim();
            if (!utils.validateEmail(email)) {
                utils.showAlert("Please enter a valid email address", "warning");
                return;
            }

            try {
                const result = await apiService.inviteUser(state.currentNote.id, email, state.userId);
                if (result.status === "success") {
                    utils.showAlert("Invitation sent successfully", "success");
                    DOM.inviteUserInput.value = "";
                }
            } catch (error) {
                utils.showAlert("Failed to send invitation", "error");
            }
        });

        // 点击外部关闭模态框
        document.addEventListener("click", (event) => {
            if (event.target.classList.contains("modal")) {
                utils.closeModal(event.target.id);
            }
        });

        // 保存笔记修改
        DOM.saveNoteBtn.addEventListener("click", actions.saveNote);
    };

    DOM.inviteModal.style.display = "none"; // 确保初始化时隐藏
    DOM.editModal.style.display = "none"; // 确保初始化时隐藏

    // 🚀 初始化应用
    const initializeApp = async () => {
        await actions.initializeSession();
        DOM.logoutButton.style.display = state.isLoggedIn ? "block" : "none";
        DOM.userButton.style.display = !state.isLoggedIn ? "block" : "none";
        if (state.userId) await actions.loadNotes();
        setupEventListeners();
    };

    initializeApp();
});