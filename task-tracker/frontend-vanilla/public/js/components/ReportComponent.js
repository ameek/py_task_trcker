class ReportComponent {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Reports button
        document.getElementById('viewReportsBtn')?.addEventListener('click', () => {
            this.openReportsModal();
        });

        // Close reports modal
        document.getElementById('closeReportsModal')?.addEventListener('click', () => {
            this.closeReportsModal();
        });

        // Report tabs - use correct selector for tab buttons
        document.querySelectorAll('.tab-btn[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchReportTab(e.target.dataset.tab);
            });
        });

        // Export buttons
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
            this.exportData('json');
        });

        document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
            this.exportData('csv');
        });
    }

    openReportsModal() {
        const modal = document.getElementById('reportsModal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadDailyReport(); // Load default tab
        }
    }

    closeReportsModal() {
        const modal = document.getElementById('reportsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    switchReportTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.report-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Report`)?.classList.add('active');
        
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
        const container = document.getElementById('dailyReportContent');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading daily report...</div>';

        try {
            const report = await apiService.getDailyReport();
            
            container.innerHTML = `
                <div class="report-summary">
                    <div class="report-stat">
                        <div class="stat-value">${report.completed_tasks}</div>
                        <div class="stat-label">Tasks Completed Today</div>
                    </div>
                    <div class="report-stat">
                        <div class="stat-value">${report.total_time_formatted || '0m'}</div>
                        <div class="stat-label">Time Spent Today</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>Completed Tasks:</h4>
                    ${report.tasks && report.tasks.length > 0 ? 
                        `<div class="task-list">
                            ${report.tasks.map(task => `
                                <div class="report-task-item">
                                    <span class="task-title">${Utils.escapeHtml(task.title)}</span>
                                    <span class="task-priority priority-${task.priority}">${Utils.formatPriority(task.priority)}</span>
                                    <span class="task-time">${Utils.formatDuration(task.total_time || 0)}</span>
                                </div>
                            `).join('')}
                        </div>` :
                        '<p class="no-data">No tasks completed today.</p>'
                    }
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="error">Failed to load daily report: ${error.message}</div>`;
        }
    }

    async loadWeeklyReport() {
        const container = document.getElementById('weeklyReportContent');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading weekly report...</div>';

        try {
            const report = await apiService.getWeeklyReport();
            
            container.innerHTML = `
                <div class="report-summary">
                    <div class="report-stat">
                        <div class="stat-value">${report.total_completed_tasks}</div>
                        <div class="stat-label">Tasks This Week</div>
                    </div>
                    <div class="report-stat">
                        <div class="stat-value">${report.total_time_formatted || '0m'}</div>
                        <div class="stat-label">Total Time This Week</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>Daily Breakdown:</h4>
                    <div class="daily-breakdown">
                        ${Object.entries(report.daily_stats || {}).map(([date, stats]) => `
                            <div class="day-stats">
                                <span class="day-date">${new Date(date).toLocaleDateString()}</span>
                                <span class="day-tasks">${stats.completed_tasks} tasks</span>
                                <span class="day-time">${Utils.formatDuration(stats.total_time)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="error">Failed to load weekly report: ${error.message}</div>`;
        }
    }

    async loadStatsReport() {
        const container = document.getElementById('statsReportContent');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading statistics...</div>';

        try {
            const stats = await apiService.getCompletionStats();
            
            container.innerHTML = `
                <div class="report-summary">
                    <div class="report-stat">
                        <div class="stat-value">${stats.total_tasks}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                    <div class="report-stat">
                        <div class="stat-value">${stats.completion_rate}%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                    <div class="report-stat">
                        <div class="stat-value">${stats.total_time_formatted || '0m'}</div>
                        <div class="stat-label">Total Time Tracked</div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>Task Status Distribution:</h4>
                    <div class="status-distribution">
                        <div class="status-item">
                            <span class="status-label">Completed:</span>
                            <span class="status-value">${stats.completed_tasks || 0}</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">In Progress:</span>
                            <span class="status-value">${stats.in_progress_tasks || 0}</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Paused:</span>
                            <span class="status-value">${stats.paused_tasks || 0}</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Pending:</span>
                            <span class="status-value">${stats.pending_tasks || 0}</span>
                        </div>
                    </div>
                </div>
                
                ${stats.category_distribution && Object.keys(stats.category_distribution).length > 0 ? `
                    <div class="report-section">
                        <h4>Category Distribution:</h4>
                        <div class="category-distribution">
                            ${Object.entries(stats.category_distribution).map(([category, data]) => `
                                <div class="category-stat">
                                    <span class="category-name">${Utils.escapeHtml(category)}:</span>
                                    <span class="category-tasks">${data.count} tasks</span>
                                    <span class="category-time">${Utils.formatDuration(data.total_time || 0)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        } catch (error) {
            container.innerHTML = `<div class="error">Failed to load statistics: ${error.message}</div>`;
        }
    }

    async exportData(format) {
        if (!['json', 'csv'].includes(format)) {
            Utils.showMessage('taskMessage', 'Invalid export format', 'error');
            return;
        }

        Utils.showLoading(true);

        try {
            const data = await apiService.exportData(format);
            const filename = `task_tracker_export_${new Date().toISOString().split('T')[0]}.${format}`;
            
            if (format === 'csv') {
                Utils.downloadFile(data, filename, 'text/csv');
            } else {
                const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                Utils.downloadFile(jsonString, filename, 'application/json');
            }
            
            Utils.showMessage('taskMessage', `Data exported as ${format.toUpperCase()}!`, 'success');
        } catch (error) {
            Utils.showMessage('taskMessage', `Failed to export data: ${error.message}`, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }
}

window.ReportComponent = ReportComponent;
