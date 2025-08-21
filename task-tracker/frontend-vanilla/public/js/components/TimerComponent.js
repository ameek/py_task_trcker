class TimerComponent {
    constructor() {
        this.activeTask = null;
        this.timer = null;
        this.startTime = null;
        this.elapsedTime = 0;
    }

    startTask(task) {
        // Stop any existing timer
        this.stopTimer();
        
        this.activeTask = task;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        this.updateActiveTaskDisplay();
        this.startTimer();
    }

    pauseTask() {
        this.stopTimer();
        this.activeTask = null;
        this.updateActiveTaskDisplay();
    }

    finishTask() {
        this.stopTimer();
        this.activeTask = null;
        this.updateActiveTaskDisplay();
    }

    startTimer() {
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
            timerElement.textContent = Utils.formatTime(this.elapsedTime);
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

    async pauseActiveTask() {
        if (!this.activeTask) return;
        
        try {
            await apiService.pauseTask(this.activeTask.id); // Use id from backend
            this.pauseTask();
            Utils.showMessage('taskMessage', 'Task paused', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to pause task: ${error.message}`, 'error');
        }
    }

    async finishActiveTask() {
        if (!this.activeTask) return;
        
        if (!confirm('Are you sure you want to finish this task?')) {
            return;
        }
        
        try {
            await apiService.finishTask(this.activeTask.id); // Use id from backend
            this.finishTask();
            Utils.showMessage('taskMessage', 'Task completed!', 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to finish task: ${error.message}`, 'error');
        }
    }

    setupEventListeners() {
        // Pause active task button
        document.getElementById('pauseTaskBtn')?.addEventListener('click', () => {
            this.pauseActiveTask();
        });

        // Finish active task button
        document.getElementById('finishTaskBtn')?.addEventListener('click', () => {
            this.finishActiveTask();
        });

        // Pause all tasks button
        document.getElementById('pauseAllBtn')?.addEventListener('click', () => {
            this.pauseAllTasks();
        });
    }

    async pauseAllTasks() {
        try {
            await apiService.pauseAllTasks();
            this.pauseTask();
            Utils.showMessage('taskMessage', 'All tasks paused', 'success');
            // Reload tasks to reflect changes
            if (window.taskApp && window.taskApp.tasks) {
                window.taskApp.tasks.loadTasks();
            }
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to pause all tasks: ${error.message}`, 'error');
        }
    }
}

window.TimerComponent = TimerComponent;
