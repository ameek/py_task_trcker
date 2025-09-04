class TaskTrackerApp {
    constructor() {
        this.currentUser = null;
        this.auth = null;
        this.tasks = null;
        this.timer = null;

        this.init();
    }

    async init() {
        // Initialize components
        this.auth = new AuthComponent(this);
        this.tasks = new TaskComponent(this);
        this.timer = new TimerComponent();
        this.categories = new CategoryComponent(this);
        this.reports = new ReportComponent(this);

        // Make taskComponent globally available for onclick handlers
        window.taskComponent = this.tasks;

        // Setup event listeners
        this.setupKeyboardShortcuts();
        this.timer.setupEventListeners();

        // Check for saved user session
        this.loadUserSession();

        // Show appropriate section
        if (this.currentUser) {
            this.showDashboard();
            // Load data after components are initialized and user is set
            await this.loadInitialData();
        } else {
            this.showAuth();
        }
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.setCurrentUser(user); // Use setCurrentUser method to properly normalize and set user
            } catch (error) {
                console.error('Error loading user session:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    setCurrentUser(user) {
        // Normalize _id to string if needed
        if (user && (user._id || user.id)) {
            // Ensure we have both _id and id for compatibility
            user._id = user._id || user.id;
            user.id = user.id || user._id;

            // Normalize to string
            if (typeof user._id === 'object' && user._id.$oid) {
                user._id = user._id.$oid;
            }
            if (typeof user.id === 'object' && user.id.$oid) {
                user.id = user.id.$oid;
            }

            user._id = String(user._id);
            user.id = String(user.id);
        }

        this.currentUser = user;
        apiService.setCurrentUser(user);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }

    async loadInitialData() {
        try {
            // Only load data if user is authenticated
            if (!this.currentUser || (!this.currentUser._id && !this.currentUser.id)) {
                console.log('User not authenticated, skipping data load');
                return;
            }

            console.log('Loading initial data for user:', this.currentUser._id || this.currentUser.id);

            await Promise.all([
                this.tasks.loadTasks(),
                this.categories.loadCategories()
            ]);

            // Load active task if any - check for tasks with in_progress status
            try {
                // First check if there are any in_progress tasks
                const activeTasks = this.tasks.tasks.filter(task => task.status === 'in_progress');
                if (activeTasks.length > 0) {
                    // Use the first active task (there should only be one)
                    const activeTask = activeTasks[0];
                    this.timer.startTask(activeTask);
                } else {
                    // Fallback: try to get active task from API
                    const activeTaskResponse = await apiService.getActiveTask();
                    if (activeTaskResponse && activeTaskResponse.active_task) {
                        this.timer.startTask(activeTaskResponse.active_task);
                    }
                }
            } catch (error) {
                console.log('No active task found or error loading active task:', error.message);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            // If authentication error, show auth screen
            if (error.message.includes('Authentication required') || error.message.includes('Not authenticated')) {
                this.showAuth();
            }
        }
    }

    showAuth() {
        this.auth.showAuth();
    }

    showDashboard() {
        this.auth.showDashboard();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.focusNewTaskForm();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.tasks.loadTasks();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.pauseAllTasks();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('taskSearch')?.focus();
                        break;
                    case '/':
                        e.preventDefault();
                        this.toggleKeyboardShortcuts();
                        break;
                }
            }
        });
    }

    focusNewTaskForm() {
        const titleInput = document.getElementById('taskTitle');
        if (titleInput) {
            titleInput.focus();
        }
    }

    async pauseAllTasks() {
        try {
            await apiService.pauseAllTasks();
            this.timer.pauseTask();
            this.tasks.loadTasks();
            Utils.showMessage('taskMessage', 'All tasks paused', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to pause all tasks: ${error.message}`, 'error');
        }
    }

    toggleKeyboardShortcuts() {
        let shortcutsDiv = document.getElementById('keyboardShortcuts');

        if (!shortcutsDiv) {
            shortcutsDiv = this.createKeyboardShortcutsDisplay();
            document.body.appendChild(shortcutsDiv);
        }

        shortcutsDiv.classList.toggle('visible');

        // Auto-hide after 5 seconds
        if (shortcutsDiv.classList.contains('visible')) {
            setTimeout(() => {
                shortcutsDiv.classList.remove('visible');
            }, 5000);
        }
    }

    createKeyboardShortcutsDisplay() {
        const shortcutsDiv = document.createElement('div');
        shortcutsDiv.id = 'keyboardShortcuts';
        shortcutsDiv.className = 'keyboard-shortcuts';
        shortcutsDiv.innerHTML = `
            <h4>Keyboard Shortcuts</h4>
            <div class="shortcut-item">
                <span>New Task</span>
                <span class="shortcut-key">Ctrl+N</span>
            </div>
            <div class="shortcut-item">
                <span>Refresh Tasks</span>
                <span class="shortcut-key">Ctrl+R</span>
            </div>
            <div class="shortcut-item">
                <span>Pause All</span>
                <span class="shortcut-key">Ctrl+P</span>
            </div>
            <div class="shortcut-item">
                <span>Search</span>
                <span class="shortcut-key">Ctrl+F</span>
            </div>
            <div class="shortcut-item">
                <span>Help</span>
                <span class="shortcut-key">Ctrl+/</span>
            </div>
            <button class="close-shortcuts" onclick="this.parentElement.classList.remove('visible')">×</button>
        `;

        return shortcutsDiv;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskApp = new TaskTrackerApp();
});
