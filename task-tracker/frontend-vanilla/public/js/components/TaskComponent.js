class TaskComponent {
    constructor(app) {
        this.app = app;
        this.tasks = [];
        this.categories = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.currentEditingTaskId = null;
        this.currentOverviewTaskId = null;
        
        this.setupEventListeners();
        this.setupModalEventListeners();
    }

    setupEventListeners() {
        // Task form
        document.getElementById('taskForm')?.addEventListener('submit', (e) => {
            this.handleCreateTask(e);
        });

        // Search
        const searchInput = document.getElementById('taskSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value.trim();
                this.renderTasks();
            }, 300));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e);
            });
        });

        // Refresh button
        document.getElementById('refreshTasks')?.addEventListener('click', () => {
            this.loadTasks();
        });
    }

    setupModalEventListeners() {
        // Edit modal event listeners
        const editModal = document.getElementById('editModal');
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const editTaskForm = document.getElementById('editTaskForm');

        // Close modal handlers
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        // Click outside modal to close
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditModal();
                }
            });
        }

        // Edit form submission
        if (editTaskForm) {
            editTaskForm.addEventListener('submit', (e) => {
                this.handleEditTask(e);
            });
        }

        // Add link functionality
        const addLinkBtn = document.getElementById('addLinkBtn');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => {
                this.addTaskLink();
            });
        }

        // Task Overview modal event listeners
        const overviewModal = document.getElementById('taskOverviewModal');
        const closeOverviewModal = document.getElementById('closeTaskOverviewModal');

        if (closeOverviewModal) {
            closeOverviewModal.addEventListener('click', () => {
                this.closeTaskOverviewModal();
            });
        }

        // Click outside modal to close
        if (overviewModal) {
            overviewModal.addEventListener('click', (e) => {
                if (e.target === overviewModal) {
                    this.closeTaskOverviewModal();
                }
            });
        }

        // Overview modal action buttons
        const overviewEditBtn = document.getElementById('overviewEditBtn');
        const overviewStartBtn = document.getElementById('overviewStartBtn');
        const overviewPauseBtn = document.getElementById('overviewPauseBtn');
        const overviewFinishBtn = document.getElementById('overviewFinishBtn');
        const overviewDeleteBtn = document.getElementById('overviewDeleteBtn');

        if (overviewEditBtn) {
            overviewEditBtn.addEventListener('click', () => {
                this.closeTaskOverviewModal();
                if (this.currentOverviewTaskId) {
                    this.openEditModal(this.currentOverviewTaskId);
                }
            });
        }

        if (overviewStartBtn) {
            overviewStartBtn.addEventListener('click', () => {
                if (this.currentOverviewTaskId) {
                    this.startTask(this.currentOverviewTaskId);
                    this.closeTaskOverviewModal();
                }
            });
        }

        if (overviewPauseBtn) {
            overviewPauseBtn.addEventListener('click', () => {
                if (this.currentOverviewTaskId) {
                    this.pauseTask(this.currentOverviewTaskId);
                    this.closeTaskOverviewModal();
                }
            });
        }

        if (overviewFinishBtn) {
            overviewFinishBtn.addEventListener('click', () => {
                if (this.currentOverviewTaskId) {
                    this.finishTask(this.currentOverviewTaskId);
                    this.closeTaskOverviewModal();
                }
            });
        }

        if (overviewDeleteBtn) {
            overviewDeleteBtn.addEventListener('click', () => {
                if (this.currentOverviewTaskId) {
                    this.deleteTask(this.currentOverviewTaskId);
                    this.closeTaskOverviewModal();
                }
            });
        }
    }

    async loadTasks() {
        Utils.showLoading(true);
        
        try {
            this.tasks = await apiService.getTasks();
            this.renderTasks();
            this.updateStats();
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to load tasks: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async loadCategories() {
        try {
            this.categories = await apiService.getCategories();
            this.updateCategorySelects();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    updateCategorySelects() {
        const selects = ['taskCategory', 'editTaskCategory'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            select.innerHTML = '<option value="">No Category</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id; // Use _id from backend
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    async handleCreateTask(e) {
        e.preventDefault();
        
        // Get values directly from form elements using their IDs
        const title = document.getElementById('taskTitle').value?.trim();
        const description = document.getElementById('taskDescription').value?.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        const category = document.getElementById('taskCategory').value;
        const tagsText = document.getElementById('taskTags').value?.trim();
        const notes = document.getElementById('taskNotes').value?.trim();

        if (!title) {
            Utils.showMessage('taskMessage', 'Please enter a task title', 'error');
            return;
        }

        Utils.showLoading(true);

        try {
            const taskData = {
                title,
                description,
                priority,
                status,
                notes
            };
            
            if (category) taskData.category = category;
            if (tagsText) taskData.tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);

            await apiService.createTask(taskData);
            
            this.clearTaskForm();
            this.loadTasks();
            Utils.showMessage('taskMessage', 'Task created successfully!', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to create task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async updateTask(taskId, updates) {
        Utils.showLoading(true);

        try {
            await apiService.updateTask(taskId, updates);
            this.loadTasks();
            Utils.showMessage('taskMessage', 'Task updated successfully!', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to update task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        Utils.showLoading(true);

        try {
            await apiService.deleteTask(taskId);
            this.loadTasks();
            Utils.showMessage('taskMessage', 'Task deleted successfully!', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to delete task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async startTask(taskId) {
        const task = this.tasks.find(t => t._id === taskId); // Use _id from backend
        if (!task) return;

        // Check if there's already an active task
        const activeTasks = this.tasks.filter(t => t.status === 'in_progress');
        const hasActiveTask = activeTasks.length > 0;
        const activeTaskName = hasActiveTask ? activeTasks[0].title : null;

        // Ask for confirmation if there's already an active task
        if (hasActiveTask && activeTaskName !== task.title) {
            const confirmed = confirm(
                `"${activeTaskName}" is currently active.\n\n` +
                `Starting "${task.title}" will automatically pause "${activeTaskName}".\n\n` +
                `Do you want to continue?`
            );
            if (!confirmed) {
                return;
            }
        }

        Utils.showLoading(true);

        try {
            await apiService.startTask(taskId);
            this.app.timer.startTask(task);
            this.loadTasks();
            
            // Provide enhanced feedback based on whether there was an active task
            if (hasActiveTask && activeTaskName !== task.title) {
                Utils.showMessage('taskMessage', 
                    `Started "${task.title}" and paused "${activeTaskName}"`, 
                    'success');
            } else {
                Utils.showMessage('taskMessage', 
                    `Started working on "${task.title}"`, 
                    'success');
            }
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to start task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async pauseTask(taskId) {
        const task = this.tasks.find(t => t._id === taskId); // Use _id from backend
        if (!task) return;

        Utils.showLoading(true);

        try {
            await apiService.pauseTask(taskId);
            this.app.timer.pauseTask();
            this.loadTasks();
            Utils.showMessage('taskMessage', `Paused "${task.title}"`, 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to pause task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async finishTask(taskId) {
        const task = this.tasks.find(t => t._id === taskId); // Use _id from backend
        if (!task) return;

        if (!confirm('Are you sure you want to finish this task?')) {
            return;
        }

        Utils.showLoading(true);

        try {
            await apiService.finishTask(taskId);
            this.app.timer.finishTask();
            this.loadTasks();
            Utils.showMessage('taskMessage', `Completed "${task.title}"!`, 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to finish task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
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

    renderTasks() {
        let filteredTasks = this.tasks;

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === this.currentFilter);
        }

        // Apply search filter
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchLower) ||
                (task.description && task.description.toLowerCase().includes(searchLower)) ||
                (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }

        const tasksList = document.getElementById('tasksList'); // Fixed element ID
        const noTasks = document.getElementById('noTasks');
        
        if (!tasksList) return;

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            if (noTasks) noTasks.style.display = 'block';
            return;
        }

        if (noTasks) noTasks.style.display = 'none';
        tasksList.innerHTML = filteredTasks.map(task => this.renderTaskItem(task)).join('');
        
        // Bind event listeners
        this.bindTaskEventListeners();
    }

    renderTaskItem(task) {
        const createdDate = Utils.formatDate(task.created_at);
        const category = task.category ? this.categories.find(c => c._id === task.category) : null; // Use _id from backend
        const categoryBadge = category ? 
            `<span class="task-category-badge" style="background-color: ${category.color}; color: white;">${category.name}</span>` : '';
        
        const tags = task.tags && task.tags.length > 0 ? 
            `<div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${Utils.escapeHtml(tag)}</span>`).join('')}</div>` : '';
        
        const notes = task.notes ? 
            `<div class="task-notes">${Utils.escapeHtml(task.notes)}</div>` : '';
        
        const totalTime = Utils.formatDuration(task.total_time || 0);
        
        return `
            <div class="task-item priority-${task.priority}" data-task-id="${task._id}">
                <div class="task-header" style="cursor: pointer;" onclick="window.taskComponent.openTaskOverviewModal('${task._id}')" title="Click to view task overview">
                    <h4 class="task-title">${Utils.escapeHtml(task.title)} <i class="fas fa-eye" style="font-size: 0.8em; opacity: 0.6; margin-left: 0.5rem;"></i></h4>
                    <span class="task-status ${task.status}">${Utils.formatStatus(task.status)}</span>
                </div>
                ${task.description ? `<p class="task-description" style="cursor: pointer;" onclick="window.taskComponent.openTaskOverviewModal('${task._id}')" title="Click to view task overview">${Utils.escapeHtml(task.description)}</p>` : ''}
                ${notes}
                ${tags}
                <div class="task-meta">
                    <span><i class="fas fa-flag"></i> ${Utils.formatPriority(task.priority)}</span>
                    ${categoryBadge}
                    <span><i class="fas fa-clock"></i> ${totalTime}</span>
                    <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-secondary overview-task" data-task-id="${task._id}" title="View overview">
                        <i class="fas fa-eye"></i> Overview
                    </button>
                    <button class="btn btn-sm btn-primary edit-task" data-task-id="${task._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${this.renderTaskActionButton(task)}
                    <button class="btn btn-sm btn-danger delete-task" data-task-id="${task._id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderTaskActionButton(task) {
        switch (task.status) {
            case 'pending':
            case 'paused':
                return `<button class="btn btn-sm btn-success start-task" data-task-id="${task._id}">
                    <i class="fas fa-play"></i> Start
                </button>`;
            case 'in_progress':
                return `
                    <button class="btn btn-sm btn-warning pause-task" data-task-id="${task._id}">
                        <i class="fas fa-pause"></i> Pause
                    </button>
                    <button class="btn btn-sm btn-success finish-task" data-task-id="${task._id}">
                        <i class="fas fa-check"></i> Finish
                    </button>
                `;
            case 'completed':
                return `<button class="btn btn-sm btn-secondary restart-task" data-task-id="${task._id}">
                    <i class="fas fa-redo"></i> Restart
                </button>`;
            default:
                return '';
        }
    }

    bindTaskEventListeners() {
        // Overview buttons
        document.querySelectorAll('.overview-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.overview-task').dataset.taskId;
                this.openTaskOverviewModal(taskId);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.edit-task').dataset.taskId;
                this.openEditModal(taskId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.delete-task').dataset.taskId;
                this.deleteTask(taskId);
            });
        });

        // Start buttons
        document.querySelectorAll('.start-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.start-task').dataset.taskId;
                this.startTask(taskId);
            });
        });

        // Pause buttons
        document.querySelectorAll('.pause-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.pause-task').dataset.taskId;
                this.pauseTask(taskId);
            });
        });

        // Finish buttons
        document.querySelectorAll('.finish-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.finish-task').dataset.taskId;
                this.finishTask(taskId);
            });
        });

        // Restart buttons
        document.querySelectorAll('.restart-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.restart-task').dataset.taskId;
                this.updateTask(taskId, { status: 'pending' });
            });
        });
    }

    openEditModal(taskId) {
        const task = this.tasks.find(t => t._id === taskId);
        if (!task) return;

        this.currentEditingTaskId = taskId;

        // Populate form fields
        document.getElementById('editTaskTitle').value = task.title || '';
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskPriority').value = task.priority || 'medium';
        document.getElementById('editTaskStatus').value = task.status || 'pending';
        document.getElementById('editTaskCategory').value = task.category || '';
        document.getElementById('editTaskTags').value = task.tags ? task.tags.join(', ') : '';
        document.getElementById('editTaskNotes').value = task.notes || '';

        // Load task links if any
        this.loadTaskLinks(taskId);

        // Show modal
        document.getElementById('editModal').style.display = 'block';
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditingTaskId = null;
        
        // Clear form
        document.getElementById('editTaskForm').reset();
        document.getElementById('taskLinksList').innerHTML = '';
        
        // Clear add link form
        document.getElementById('newLinkUrl').value = '';
        document.getElementById('newLinkTitle').value = '';
    }

    async handleEditTask(e) {
        e.preventDefault();
        
        if (!this.currentEditingTaskId) return;

        const formData = new FormData(e.target);
        const title = document.getElementById('editTaskTitle').value?.trim();
        const description = document.getElementById('editTaskDescription').value?.trim();
        const priority = document.getElementById('editTaskPriority').value;
        const status = document.getElementById('editTaskStatus').value;
        const category = document.getElementById('editTaskCategory').value;
        const tagsText = document.getElementById('editTaskTags').value?.trim();
        const notes = document.getElementById('editTaskNotes').value?.trim();

        if (!title) {
            Utils.showMessage('taskMessage', 'Please enter a task title', 'error');
            return;
        }

        Utils.showLoading(true);

        try {
            const taskData = {
                title,
                description,
                priority,
                status,
                notes
            };
            
            if (category) taskData.category = category;
            if (tagsText) taskData.tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);

            await apiService.updateTask(this.currentEditingTaskId, taskData);
            
            this.closeEditModal();
            this.loadTasks();
            Utils.showMessage('taskMessage', 'Task updated successfully!', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to update task: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async loadTaskLinks(taskId) {
        try {
            // Check if the API service has a method to get task links
            if (typeof apiService.getTaskLinks === 'function') {
                const links = await apiService.getTaskLinks(taskId);
                this.renderTaskLinks(links);
            } else {
                // If no task links API, just clear the list
                document.getElementById('taskLinksList').innerHTML = '';
            }
        } catch (error) {
            console.error('Failed to load task links:', error);
            document.getElementById('taskLinksList').innerHTML = '<p class="no-links">No links added yet.</p>';
        }
    }

    renderTaskLinks(links) {
        const linksList = document.getElementById('taskLinksList');
        if (!linksList) return;

        if (!links || links.length === 0) {
            linksList.innerHTML = '<p class="no-links">No links added yet.</p>';
            return;
        }

        linksList.innerHTML = links.map(link => `
            <div class="task-link-item">
                <a href="${Utils.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i>
                    ${Utils.escapeHtml(link.title || link.url)}
                </a>
                <button class="btn btn-sm btn-danger remove-link" data-link-id="${link.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Bind remove link event listeners
        linksList.querySelectorAll('.remove-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const linkId = e.target.closest('.remove-link').dataset.linkId;
                this.removeTaskLink(linkId);
            });
        });
    }

    async addTaskLink() {
        const url = document.getElementById('newLinkUrl').value?.trim();
        const title = document.getElementById('newLinkTitle').value?.trim();

        if (!url) {
            Utils.showMessage('taskMessage', 'Please enter a URL', 'error');
            return;
        }

        if (!this.currentEditingTaskId) return;

        try {
            if (typeof apiService.createTaskLink === 'function') {
                await apiService.createTaskLink(this.currentEditingTaskId, { url, title });
                document.getElementById('newLinkUrl').value = '';
                document.getElementById('newLinkTitle').value = '';
                this.loadTaskLinks(this.currentEditingTaskId);
                Utils.showMessage('taskMessage', 'Link added successfully!', 'success');
            } else {
                Utils.showMessage('taskMessage', 'Task links feature not available', 'error');
            }
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to add link: ${error.message}`, 'error');
        }
    }

    async removeTaskLink(linkId) {
        if (!confirm('Are you sure you want to remove this link?')) {
            return;
        }

        try {
            if (typeof apiService.deleteTaskLink === 'function') {
                await apiService.deleteTaskLink(this.currentEditingTaskId, linkId);
                this.loadTaskLinks(this.currentEditingTaskId);
                Utils.showMessage('taskMessage', 'Link removed successfully!', 'success');
            } else {
                Utils.showMessage('taskMessage', 'Task links feature not available', 'error');
            }
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to remove link: ${error.message}`, 'error');
        }
    }

    // Task Overview Modal Methods
    openTaskOverviewModal(taskId) {
        const task = this.tasks.find(t => t._id === taskId);
        if (!task) return;

        this.currentOverviewTaskId = taskId;

        // Populate overview content
        document.getElementById('overviewTaskTitle').textContent = task.title || 'Untitled Task';
        document.getElementById('overviewTaskStatus').textContent = Utils.formatStatus(task.status);
        document.getElementById('overviewTaskStatus').className = `task-status ${task.status}`;
        
        // Set priority badge
        const priorityBadge = document.getElementById('overviewTaskPriority');
        priorityBadge.textContent = Utils.formatPriority(task.priority);
        priorityBadge.className = `priority-badge ${task.priority}`;

        // Description
        const descriptionEl = document.getElementById('overviewTaskDescription');
        descriptionEl.textContent = task.description || 'No description provided';

        // Notes
        const notesEl = document.getElementById('overviewTaskNotes');
        notesEl.textContent = task.notes || 'No notes added';

        // Tags
        const tagsEl = document.getElementById('overviewTaskTags');
        if (task.tags && task.tags.length > 0) {
            tagsEl.innerHTML = task.tags.map(tag => 
                `<span class="task-tag">${Utils.escapeHtml(tag)}</span>`
            ).join('');
        } else {
            tagsEl.textContent = 'No tags';
        }

        // Category
        const categoryEl = document.getElementById('overviewTaskCategory');
        const category = task.category ? this.categories.find(c => c._id === task.category) : null;
        if (category) {
            categoryEl.innerHTML = `
                <span class="category-badge" style="background-color: ${category.color}; color: white;">
                    ${category.name}
                </span>
            `;
        } else {
            categoryEl.textContent = 'No category';
        }

        // Time information
        document.getElementById('overviewTotalTime').textContent = Utils.formatDuration(task.total_time || 0);
        document.getElementById('overviewCreatedDate').textContent = Utils.formatDate(task.created_at);
        document.getElementById('overviewUpdatedDate').textContent = Utils.formatDate(task.updated_at || task.created_at);

        // Load task links
        this.loadTaskLinksForOverview(taskId);

        // Update action buttons based on task status
        this.updateOverviewActionButtons(task);

        // Show modal
        document.getElementById('taskOverviewModal').style.display = 'block';
    }

    closeTaskOverviewModal() {
        document.getElementById('taskOverviewModal').style.display = 'none';
        this.currentOverviewTaskId = null;
    }

    updateOverviewActionButtons(task) {
        const startBtn = document.getElementById('overviewStartBtn');
        const pauseBtn = document.getElementById('overviewPauseBtn');
        const finishBtn = document.getElementById('overviewFinishBtn');

        // Hide all action buttons first
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        finishBtn.style.display = 'none';

        // Show appropriate buttons based on status
        switch (task.status) {
            case 'pending':
            case 'paused':
                startBtn.style.display = 'inline-block';
                break;
            case 'in_progress':
                pauseBtn.style.display = 'inline-block';
                finishBtn.style.display = 'inline-block';
                break;
            case 'completed':
                // No action buttons for completed tasks
                break;
        }
    }

    async loadTaskLinksForOverview(taskId) {
        const linksEl = document.getElementById('overviewTaskLinks');
        
        try {
            if (typeof apiService.getTaskLinks === 'function') {
                const links = await apiService.getTaskLinks(taskId);
                if (links && links.length > 0) {
                    linksEl.innerHTML = links.map(link => `
                        <div class="task-link-item">
                            <a href="${Utils.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i>
                                ${Utils.escapeHtml(link.title || link.url)}
                            </a>
                        </div>
                    `).join('');
                } else {
                    linksEl.textContent = 'No links added';
                }
            } else {
                linksEl.textContent = 'No links added';
            }
        } catch (error) {
            console.error('Failed to load task links for overview:', error);
            linksEl.textContent = 'No links added';
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(task => task.status === 'pending').length;
        const inProgress = this.tasks.filter(task => task.status === 'in_progress').length;
        const paused = this.tasks.filter(task => task.status === 'paused').length;
        const completed = this.tasks.filter(task => task.status === 'completed').length;

        const elements = {
            'totalTasks': total,
            'pendingTasks': pending,
            'inProgressTasks': inProgress,
            'pausedTasks': paused,
            'completedTasks': completed
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    clearTaskForm() {
        const form = document.getElementById('taskForm');
        if (form) {
            form.reset();
            // Reset to default values
            const priority = document.getElementById('taskPriority');
            const status = document.getElementById('taskStatus');
            if (priority) priority.value = 'medium';
            if (status) status.value = 'pending';
        }
    }
}

window.TaskComponent = TaskComponent;
