class TaskTracker {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.tasks = [];
        this.categories = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.activeTask = null;
        this.timer = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.taskLinks = {};

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
        this.setupKeyboardShortcuts();
    }

    bindEvents() {
        // Auth tab switching
        document.getElementById('loginTab').addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('registerTab').addEventListener('click', () => this.switchAuthTab('register'));

        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Task creation
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleCreateTask(e));

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('editTaskForm').addEventListener('submit', (e) => this.handleUpdateTask(e));

        // Active task controls
        document.getElementById('pauseTaskBtn').addEventListener('click', () => this.pauseActiveTask());
        document.getElementById('finishTaskBtn').addEventListener('click', () => this.finishActiveTask());
        document.getElementById('pauseAllBtn').addEventListener('click', () => this.pauseAllTasks());
        document.getElementById('pauseAllQuickBtn').addEventListener('click', () => this.pauseAllTasks());
        document.getElementById('viewReportsBtn').addEventListener('click', () => this.openReportsModal());

        // Category management
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory());

        // Reports modal
        document.getElementById('closeReportsModal').addEventListener('click', () => this.closeReportsModal());
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchReportTab(e.target.dataset.tab));
        });
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportData('json'));
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportData('csv'));

        // Task links
        document.getElementById('addLinkBtn').addEventListener('click', () => this.addTaskLink());

        // Close modal on outside click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
    }

    checkAuthState() {
        if (this.currentUser) {
            this.showDashboard();
            this.loadTasks();
        } else {
            this.showAuth();
        }
    }

    switchAuthTab(tab) {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('authMessage', 'Please fill in all fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Send as form data for simplified backend
            const response = await axios.post(`${this.API_BASE}/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);

            this.currentUser = response.data.user;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showDashboard();
            this.loadTasks();
            this.showMessage('authMessage', 'Login successful!', 'success');

        } catch (error) {
            this.showMessage('authMessage', `Login failed: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (!name || !email || !password) {
            this.showMessage('authMessage', 'Please fill in all fields', 'error');
            return;
        }

        if (password.length < 4) {
            this.showMessage('authMessage', 'Password must be at least 4 characters', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await axios.post(`${this.API_BASE}/auth/register`, {
                full_name: name,
                email: email,
                password: password
            });

            this.currentUser = response.data.user;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showDashboard();
            this.loadTasks();
            this.showMessage('authMessage', 'Registration successful!', 'success');

        } catch (error) {
            this.showMessage('authMessage', `Registration failed: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        this.currentUser = null;
        this.tasks = [];
        
        localStorage.removeItem('currentUser');
        
        this.showAuth();
        this.clearForms();
        this.showMessage('authMessage', 'Logged out successfully', 'success');
    }

    async loadTasks() {
        this.showLoading(true);
        
        try {
            const response = await axios.get(`${this.API_BASE}/tasks/`);
            this.tasks = response.data;
            
            // Check for active task
            const activeTaskResponse = await axios.get(`${this.API_BASE}/tasks/active`);
            if (activeTaskResponse.data.active_task) {
                this.activeTask = activeTaskResponse.data.active_task;
                // Don't start timer automatically - user needs to manually resume
            }
            
            this.renderTasks();
            this.updateStats();
            this.updateActiveTaskDisplay();

        } catch (error) {
            this.showMessage('taskMessage', `Failed to load tasks: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const noTasks = document.getElementById('noTasks');
        
        let filteredTasks = this.tasks;
        if (this.currentFilter !== 'all') {
            filteredTasks = this.tasks.filter(task => task.status === this.currentFilter);
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            noTasks.style.display = 'block';
            return;
        }

        noTasks.style.display = 'none';
        
        tasksList.innerHTML = filteredTasks.map(task => this.renderTaskItem(task)).join('');
        
        // Bind task action events
        this.bindTaskEvents();
    }

    renderTaskItem(task) {
        const createdDate = new Date(task.created_at).toLocaleDateString();
        const createdTime = new Date(task.created_at).toLocaleTimeString();
        const isActive = this.activeTask && this.activeTask.id === task.id;
        const timerDisplay = isActive ? `<span class="task-timer running">${this.formatTime(this.elapsedTime)}</span>` : '';
        
        return `
            <div class="task-item priority-${task.priority} ${isActive ? 'active' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <h4 class="task-title">${this.escapeHtml(task.title)} ${timerDisplay}</h4>
                    <span class="task-status ${task.status}">${this.formatStatus(task.status)}</span>
                </div>
                ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span><i class="fas fa-flag"></i> ${this.formatPriority(task.priority)}</span>
                    <span><i class="fas fa-calendar"></i> ${createdDate} ${createdTime}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary edit-task" data-task-id="${task.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${this.renderTaskActionButton(task)}
                    <button class="btn btn-sm btn-danger delete-task" data-task-id="${task.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderTaskActionButton(task) {
        const isActive = this.activeTask && this.activeTask.id === task.id;
        
        if (isActive) {
            return `<button class="btn btn-sm btn-warning pause-task" data-task-id="${task.id}">
                <i class="fas fa-pause"></i> Pause
            </button>`;
        } else if (task.status === 'in_progress' || task.status === 'paused') {
            return `<button class="btn btn-sm btn-info resume-task" data-task-id="${task.id}">
                <i class="fas fa-play"></i> Resume
            </button>`;
        } else if (task.status === 'pending') {
            return `<button class="btn btn-sm btn-success start-task" data-task-id="${task.id}">
                <i class="fas fa-play"></i> Start
            </button>`;
        } else if (task.status === 'completed') {
            return `<button class="btn btn-sm btn-secondary next-status" data-task-id="${task.id}">
                <i class="fas fa-redo"></i> Restart
            </button>`;
        } else {
            return `<button class="btn btn-sm btn-success next-status" data-task-id="${task.id}">
                <i class="fas fa-arrow-right"></i> ${this.getNextStatusText(task.status)}
            </button>`;
        }
    }

    bindTaskEvents() {
        // Edit task buttons
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.edit-task').dataset.taskId;
                this.openEditModal(taskId);
            });
        });

        // Start task buttons
        document.querySelectorAll('.start-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.start-task').dataset.taskId;
                this.startTask(taskId);
            });
        });

        // Pause task buttons
        document.querySelectorAll('.pause-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.pause-task').dataset.taskId;
                this.pauseTask(taskId);
            });
        });

        // Resume task buttons
        document.querySelectorAll('.resume-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.resume-task').dataset.taskId;
                this.resumeTask(taskId);
            });
        });

        // Next status buttons (for completed tasks)
        document.querySelectorAll('.next-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.next-status').dataset.taskId;
                this.updateTaskStatus(taskId);
            });
        });

        // Delete task buttons
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.delete-task').dataset.taskId;
                this.deleteTask(taskId);
            });
        });
    }

    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskStatus').value = task.status;
        
        document.getElementById('editModal').style.display = 'flex';
    }

    closeEditModal() {
        this.editingTaskId = null;
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editTaskForm').reset();
    }

    async handleUpdateTask(e) {
        e.preventDefault();
        
        if (!this.editingTaskId) return;

        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const priority = document.getElementById('editTaskPriority').value;
        const status = document.getElementById('editTaskStatus').value;
        const category = document.getElementById('editTaskCategory').value;
        const tagsText = document.getElementById('editTaskTags').value.trim();
        const notes = document.getElementById('editTaskNotes').value.trim();

        if (!title) {
            this.showMessage('taskMessage', 'Please enter a task title', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const updateData = {
                title: title,
                description: description,
                priority: priority,
                status: status,
                category: category || '',
                notes: notes
            };
            
            if (tagsText) {
                updateData.tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else {
                updateData.tags = [];
            }

            await axios.put(`${this.API_BASE}/tasks/${this.editingTaskId}`, updateData);

            this.closeEditModal();
            this.loadTasks();
            this.showMessage('taskMessage', 'Task updated successfully!', 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to update task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async updateTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const nextStatus = this.getNextStatus(task.status);
        
        this.showLoading(true);

        try {
            await axios.put(`${this.API_BASE}/tasks/${taskId}`, {
                status: nextStatus
            });

            this.loadTasks();
            this.showMessage('taskMessage', `Task status updated to ${this.formatStatus(nextStatus)}!`, 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to update task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Timer and Task Management Functions
    async startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.showLoading(true);

        try {
            // Use the new backend endpoint for starting tasks
            const response = await axios.post(`${this.API_BASE}/tasks/${taskId}/start`);

            // Start timer
            this.activeTask = response.data;
            this.startTime = Date.now();
            this.elapsedTime = 0;
            this.startTimer();
            
            // Update UI
            this.updateActiveTaskDisplay();
            this.loadTasks();
            this.showMessage('taskMessage', `Started working on "${task.title}"`, 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to start task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async pauseTask(taskId, showMessage = true) {
        if (!this.activeTask || this.activeTask.id !== taskId) return;

        this.showLoading(true);

        try {
            // Use the new backend endpoint for pausing tasks
            await axios.post(`${this.API_BASE}/tasks/${taskId}/pause`);
            
            // Stop timer
            this.stopTimer();
            
            // Clear active task
            const taskTitle = this.activeTask.title;
            this.activeTask = null;
            
            // Update UI
            this.updateActiveTaskDisplay();
            this.loadTasks();
            
            if (showMessage) {
                this.showMessage('taskMessage', `Paused "${taskTitle}"`, 'success');
            }

        } catch (error) {
            this.showMessage('taskMessage', `Failed to pause task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async resumeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Start the selected task (backend will handle pausing others)
        await this.startTask(taskId);
    }

    pauseActiveTask() {
        if (this.activeTask) {
            this.pauseTask(this.activeTask.id);
        }
    }

    async finishActiveTask() {
        if (!this.activeTask) return;

        if (!confirm('Are you sure you want to finish this task?')) {
            return;
        }

        this.showLoading(true);

        try {
            // Use the new backend endpoint for finishing tasks
            await axios.post(`${this.API_BASE}/tasks/${this.activeTask.id}/finish`);

            // Stop timer
            this.stopTimer();
            
            const taskTitle = this.activeTask.title;
            this.activeTask = null;
            
            // Update UI
            this.updateActiveTaskDisplay();
            this.loadTasks();
            this.showMessage('taskMessage', `Completed "${taskTitle}"!`, 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to finish task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async pauseAllTasks() {
        this.showLoading(true);

        try {
            // Use the new backend endpoint for pausing all tasks
            await axios.post(`${this.API_BASE}/tasks/pause-all`);
            
            // Stop timer
            this.stopTimer();
            this.activeTask = null;
            
            // Update UI
            this.updateActiveTaskDisplay();
            this.loadTasks();
            this.showMessage('taskMessage', 'All tasks paused', 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to pause all tasks: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Timer Functions
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('timerDisplay');
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.elapsedTime);
        }
    }

    updateActiveTaskDisplay() {
        const activeTaskSection = document.getElementById('activeTaskSection');
        
        if (this.activeTask) {
            activeTaskSection.style.display = 'block';
            document.getElementById('activeTaskTitle').textContent = this.activeTask.title;
            document.getElementById('activeTaskDescription').textContent = this.activeTask.description || 'No description';
            this.updateTimerDisplay();
        } else {
            activeTaskSection.style.display = 'none';
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        this.showLoading(true);

        try {
            await axios.delete(`${this.API_BASE}/tasks/${taskId}`);
            this.loadTasks();
            this.showMessage('taskMessage', 'Task deleted successfully!', 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to delete task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleFilter(e) {
        const status = e.target.dataset.status;
        this.currentFilter = status;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.renderTasks();
    }

    updateStats() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(task => task.status === 'pending').length;
        const inProgress = this.tasks.filter(task => task.status === 'in_progress').length;
        const paused = this.tasks.filter(task => task.status === 'paused').length;
        const completed = this.tasks.filter(task => task.status === 'completed').length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('inProgressTasks').textContent = inProgress;
        document.getElementById('pausedTasks').textContent = paused;
        document.getElementById('completedTasks').textContent = completed;
    }

    showAuth() {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('userNav').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('userNav').style.display = 'flex';
        document.getElementById('welcomeText').textContent = `Welcome, ${this.currentUser?.full_name || 'User'}!`;
        
        // Initialize active task display
        this.updateActiveTaskDisplay();
        
        // Load categories
        this.loadCategories();
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `message ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }

    clearForms() {
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        this.clearTaskForm();
    }

    clearTaskForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskStatus').value = 'pending';
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'paused': 'Paused',
            'completed': 'Completed'
        };
        return statusMap[status] || status;
    }

    formatPriority(priority) {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    }

    getNextStatus(currentStatus) {
        const statusFlow = {
            'pending': 'in_progress',
            'in_progress': 'completed',
            'paused': 'in_progress',
            'completed': 'pending'
        };
        return statusFlow[currentStatus] || 'pending';
    }

    getNextStatusText(currentStatus) {
        const nextStatus = this.getNextStatus(currentStatus);
        return `Mark as ${this.formatStatus(nextStatus)}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Category Management
    async loadCategories() {
        try {
            const response = await axios.get(`${this.API_BASE}/categories/`);
            this.categories = response.data;
            this.updateCategorySelects();
            this.renderCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    updateCategorySelects() {
        const taskCategorySelect = document.getElementById('taskCategory');
        const editTaskCategorySelect = document.getElementById('editTaskCategory');
        
        [taskCategorySelect, editTaskCategorySelect].forEach(select => {
            // Clear existing options except "No Category"
            select.innerHTML = '<option value="">No Category</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = this.categories.map(category => `
            <div class="category-tag" style="background-color: ${category.color}; color: white;">
                ${this.escapeHtml(category.name)}
                <button class="delete-category" data-category-id="${category.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Bind delete events
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.delete-category').dataset.categoryId;
                this.deleteCategory(categoryId);
            });
        });
    }

    async addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        const color = document.getElementById('newCategoryColor').value;
        
        if (!name) {
            this.showMessage('taskMessage', 'Category name is required', 'error');
            return;
        }
        
        try {
            await axios.post(`${this.API_BASE}/categories/`, {
                name: name,
                color: color
            });
            
            document.getElementById('newCategoryName').value = '';
            document.getElementById('newCategoryColor').value = '#007bff';
            
            this.loadCategories();
            this.showMessage('taskMessage', 'Category added successfully!', 'success');
        } catch (error) {
            this.showMessage('taskMessage', `Failed to add category: ${error.response?.data?.detail || error.message}`, 'error');
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }
        
        try {
            await axios.delete(`${this.API_BASE}/categories/${categoryId}`);
            this.loadCategories();
            this.showMessage('taskMessage', 'Category deleted successfully!', 'success');
        } catch (error) {
            this.showMessage('taskMessage', `Failed to delete category: ${error.response?.data?.detail || error.message}`, 'error');
        }
    }

    // Enhanced Task Creation
    async handleCreateTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        const category = document.getElementById('taskCategory').value;
        const tagsText = document.getElementById('taskTags').value.trim();
        const notes = document.getElementById('taskNotes').value.trim();
        
        if (!title) {
            this.showMessage('taskMessage', 'Please enter a task title', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const taskData = {
                title: title,
                description: description,
                priority: priority,
                status: status,
                notes: notes
            };
            
            if (category) taskData.category = category;
            if (tagsText) taskData.tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);

            await axios.post(`${this.API_BASE}/tasks/`, taskData);

            this.clearTaskForm();
            this.loadTasks();
            this.showMessage('taskMessage', 'Task created successfully!', 'success');

        } catch (error) {
            this.showMessage('taskMessage', `Failed to create task: ${error.response?.data?.detail || error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Enhanced Task Rendering
    renderTaskItem(task) {
        const createdDate = new Date(task.created_at).toLocaleDateString();
        const createdTime = new Date(task.created_at).toLocaleTimeString();
        const isActive = this.activeTask && this.activeTask.id === task.id;
        const timerDisplay = isActive ? `<span class="task-timer running">${this.formatTime(this.elapsedTime)}</span>` : '';
        
        const category = task.category ? this.categories.find(c => c.id === task.category) : null;
        const categoryBadge = category ? 
            `<span class="task-category-badge" style="background-color: ${category.color}; color: white;">${category.name}</span>` : '';
        
        const tags = task.tags && task.tags.length > 0 ? 
            `<div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : '';
        
        const notes = task.notes ? 
            `<div class="task-notes">${this.escapeHtml(task.notes)}</div>` : '';
        
        const totalTime = task.total_time ? this.formatTime(task.total_time * 1000) : '00:00:00';
        
        return `
            <div class="task-item priority-${task.priority} ${isActive ? 'active' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <h4 class="task-title">${this.escapeHtml(task.title)} ${timerDisplay}</h4>
                    <span class="task-status ${task.status}">${this.formatStatus(task.status)}</span>
                </div>
                ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                ${notes}
                ${tags}
                <div class="task-meta">
                    <span><i class="fas fa-flag"></i> ${this.formatPriority(task.priority)}</span>
                    ${categoryBadge}
                    <span><i class="fas fa-clock"></i> Total: ${totalTime}</span>
                    <span><i class="fas fa-calendar"></i> ${createdDate} ${createdTime}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary edit-task" data-task-id="${task.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${this.renderTaskActionButton(task)}
                    <button class="btn btn-sm btn-danger delete-task" data-task-id="${task.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Task Links Management
    async loadTaskLinks(taskId) {
        try {
            const response = await axios.get(`${this.API_BASE}/tasks/${taskId}/links`);
            this.taskLinks[taskId] = response.data;
            this.renderTaskLinks(taskId);
        } catch (error) {
            console.error('Failed to load task links:', error);
        }
    }

    renderTaskLinks(taskId) {
        const linksList = document.getElementById('taskLinksList');
        const links = this.taskLinks[taskId] || [];
        
        linksList.innerHTML = links.map(link => `
            <div class="task-link-item">
                <div class="task-link-info">
                    <a href="${link.url}" target="_blank">${link.url}</a>
                    ${link.title ? `<span class="link-title">${this.escapeHtml(link.title)}</span>` : ''}
                </div>
                <button class="btn btn-sm btn-danger delete-link" data-link-id="${link.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Bind delete events
        document.querySelectorAll('.delete-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const linkId = e.target.closest('.delete-link').dataset.linkId;
                this.deleteTaskLink(taskId, linkId);
            });
        });
    }

    async addTaskLink() {
        const url = document.getElementById('newLinkUrl').value.trim();
        const title = document.getElementById('newLinkTitle').value.trim();
        
        if (!url) {
            this.showMessage('taskMessage', 'Link URL is required', 'error');
            return;
        }
        
        if (!this.editingTaskId) return;
        
        try {
            await axios.post(`${this.API_BASE}/tasks/${this.editingTaskId}/links`, {
                url: url,
                title: title
            });
            
            document.getElementById('newLinkUrl').value = '';
            document.getElementById('newLinkTitle').value = '';
            
            this.loadTaskLinks(this.editingTaskId);
            this.showMessage('taskMessage', 'Link added successfully!', 'success');
        } catch (error) {
            this.showMessage('taskMessage', `Failed to add link: ${error.response?.data?.detail || error.message}`, 'error');
        }
    }

    async deleteTaskLink(taskId, linkId) {
        try {
            await axios.delete(`${this.API_BASE}/tasks/${taskId}/links/${linkId}`);
            this.loadTaskLinks(taskId);
            this.showMessage('taskMessage', 'Link deleted successfully!', 'success');
        } catch (error) {
            this.showMessage('taskMessage', `Failed to delete link: ${error.response?.data?.detail || error.message}`, 'error');
        }
    }

    // Enhanced Edit Modal
    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskStatus').value = task.status;
        document.getElementById('editTaskCategory').value = task.category || '';
        document.getElementById('editTaskTags').value = task.tags ? task.tags.join(', ') : '';
        document.getElementById('editTaskNotes').value = task.notes || '';
        
        // Load task links
        this.loadTaskLinks(taskId);
        
        document.getElementById('editModal').style.display = 'flex';
    }

    // Reports and Analytics
    openReportsModal() {
        document.getElementById('reportsModal').style.display = 'flex';
        this.loadDailyReport();
    }

    closeReportsModal() {
        document.getElementById('reportsModal').style.display = 'none';
    }

    switchReportTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.report-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}Report`).classList.add('active');
        
        // Load appropriate data
        switch(tab) {
            case 'daily':
                this.loadDailyReport();
                break;
            case 'weekly':
                this.loadWeeklyReport();
                break;
            case 'stats':
                this.loadStatsReport();
                break;
        }
    }

    async loadDailyReport() {
        try {
            const response = await axios.get(`${this.API_BASE}/reports/daily/`);
            const report = response.data;
            
            document.getElementById('dailyReportContent').innerHTML = `
                <div class="report-stats">
                    <div class="report-stat-card">
                        <div class="stat-value">${report.completed_tasks}</div>
                        <div class="stat-label">Tasks Completed</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="stat-value">${report.total_time_formatted}</div>
                        <div class="stat-label">Time Spent</div>
                    </div>
                </div>
                <h4>Completed Tasks Today:</h4>
                ${report.tasks.length > 0 ? 
                    `<ul>${report.tasks.map(task => `<li><strong>${task.title}</strong> (${task.priority})</li>`).join('')}</ul>` :
                    '<p>No tasks completed today.</p>'
                }
            `;
        } catch (error) {
            document.getElementById('dailyReportContent').innerHTML = '<p>Failed to load daily report.</p>';
        }
    }

    async loadWeeklyReport() {
        try {
            const response = await axios.get(`${this.API_BASE}/reports/weekly/`);
            const report = response.data;
            
            document.getElementById('weeklyReportContent').innerHTML = `
                <div class="report-stats">
                    <div class="report-stat-card">
                        <div class="stat-value">${report.total_completed_tasks}</div>
                        <div class="stat-label">Tasks Completed This Week</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="stat-value">${report.total_time_formatted}</div>
                        <div class="stat-label">Total Time This Week</div>
                    </div>
                </div>
                <h4>Daily Breakdown:</h4>
                <div class="daily-breakdown">
                    ${Object.entries(report.daily_stats).map(([date, stats]) => `
                        <div class="day-stats">
                            <strong>${new Date(date).toLocaleDateString()}:</strong> 
                            ${stats.completed_tasks} tasks, ${this.formatTime(stats.total_time * 1000)}
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            document.getElementById('weeklyReportContent').innerHTML = '<p>Failed to load weekly report.</p>';
        }
    }

    async loadStatsReport() {
        try {
            const response = await axios.get(`${this.API_BASE}/reports/stats`);
            const stats = response.data;
            
            document.getElementById('statsReportContent').innerHTML = `
                <div class="report-stats">
                    <div class="report-stat-card">
                        <div class="stat-value">${stats.total_tasks}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="stat-value">${stats.completion_rate}%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="stat-value">${stats.total_time_formatted}</div>
                        <div class="stat-label">Total Time Tracked</div>
                    </div>
                </div>
                <h4>Task Status Distribution:</h4>
                <ul>
                    <li>Completed: ${stats.completed_tasks}</li>
                    <li>In Progress: ${stats.in_progress_tasks}</li>
                    <li>Paused: ${stats.paused_tasks}</li>
                    <li>Pending: ${stats.pending_tasks}</li>
                </ul>
                
                <h4>Category Distribution:</h4>
                ${Object.entries(stats.category_distribution).map(([category, data]) => `
                    <div class="category-stat">
                        <strong>${category}:</strong> ${data.count} tasks, ${this.formatTime(data.total_time * 1000)}
                    </div>
                `).join('')}
            `;
        } catch (error) {
            document.getElementById('statsReportContent').innerHTML = '<p>Failed to load statistics.</p>';
        }
    }

    async exportData(format) {
        try {
            const response = await axios.get(`${this.API_BASE}/reports/export/${format}`, {
                responseType: format === 'csv' ? 'blob' : 'json'
            });
            
            const filename = `task_tracker_export_${new Date().toISOString().split('T')[0]}.${format}`;
            
            if (format === 'csv') {
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const dataStr = JSON.stringify(response.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
            }
            
            this.showMessage('taskMessage', `Data exported as ${format.toUpperCase()}!`, 'success');
        } catch (error) {
            this.showMessage('taskMessage', `Failed to export data: ${error.response?.data?.detail || error.message}`, 'error');
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        document.getElementById('taskTitle').focus();
                    }
                    break;
                case 'p':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.pauseAllTasks();
                    }
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.openReportsModal();
                    }
                    break;
                case '?':
                    e.preventDefault();
                    this.toggleKeyboardShortcuts();
                    break;
            }
        });
    }

    toggleKeyboardShortcuts() {
        const shortcuts = document.getElementById('keyboardShortcuts');
        if (!shortcuts) {
            this.createKeyboardShortcutsDisplay();
        } else {
            shortcuts.classList.toggle('visible');
        }
    }

    createKeyboardShortcutsDisplay() {
        const shortcutsDiv = document.createElement('div');
        shortcutsDiv.id = 'keyboardShortcuts';
        shortcutsDiv.className = 'keyboard-shortcuts visible';
        shortcutsDiv.innerHTML = `
            <h4>Keyboard Shortcuts</h4>
            <div class="shortcut-item">
                <span>New Task</span>
                <span class="shortcut-key">Ctrl+N</span>
            </div>
            <div class="shortcut-item">
                <span>Pause All</span>
                <span class="shortcut-key">Ctrl+P</span>
            </div>
            <div class="shortcut-item">
                <span>Reports</span>
                <span class="shortcut-key">Ctrl+R</span>
            </div>
            <div class="shortcut-item">
                <span>Help</span>
                <span class="shortcut-key">?</span>
            </div>
        `;
        document.body.appendChild(shortcutsDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            shortcutsDiv.classList.remove('visible');
        }, 5000);
    }

    clearTaskForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskStatus').value = 'pending';
        document.getElementById('taskCategory').value = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskApp();
});
