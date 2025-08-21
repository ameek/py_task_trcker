const Task = require('../models/Task');
const TimeSession = require('../models/TimeSession');

class ReportService {
    static async getDailyReport(userId, date = new Date()) {
        const tasks = await Task.getDailyReport(userId, date);
        
        let totalTime = 0;
        tasks.forEach(task => {
            totalTime += task.total_time || 0;
        });

        return {
            date: date.toISOString().split('T')[0],
            completed_tasks: tasks.length,
            total_time: totalTime,
            total_time_formatted: this.formatDuration(totalTime),
            tasks: tasks.map(task => ({
                id: task._id,
                title: task.title,
                priority: task.priority,
                total_time: task.total_time || 0
            }))
        };
    }

    static async getWeeklyReport(userId) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const tasks = await Task.getWeeklyReport(userId, startOfWeek, endOfWeek);
        
        let totalTime = 0;
        const dailyStats = {};

        // Initialize daily stats
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            dailyStats[dateKey] = {
                completed_tasks: 0,
                total_time: 0
            };
        }

        // Aggregate task data
        tasks.forEach(task => {
            totalTime += task.total_time || 0;
            const taskDate = task.completed_at ? task.completed_at.toISOString().split('T')[0] : 
                            task.updated_at.toISOString().split('T')[0];
            if (dailyStats[taskDate]) {
                dailyStats[taskDate].completed_tasks++;
                dailyStats[taskDate].total_time += task.total_time || 0;
            }
        });

        return {
            start_date: startOfWeek.toISOString().split('T')[0],
            end_date: endOfWeek.toISOString().split('T')[0],
            total_completed_tasks: tasks.length,
            total_time: totalTime,
            total_time_formatted: this.formatDuration(totalTime),
            daily_stats: dailyStats
        };
    }

    static async getCompletionStats(userId) {
        const allTasks = await Task.findByUserId(userId);
        
        let totalTasks = allTasks.length;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let pausedTasks = 0;
        let pendingTasks = 0;
        let totalTime = 0;
        const categoryDistribution = {};

        allTasks.forEach(task => {
            totalTime += task.total_time || 0;
            
            switch (task.status) {
                case 'completed':
                    completedTasks++;
                    break;
                case 'in_progress':
                    inProgressTasks++;
                    break;
                case 'paused':
                    pausedTasks++;
                    break;
                default:
                    pendingTasks++;
            }

            // Category distribution
            const category = task.category || 'Uncategorized';
            if (!categoryDistribution[category]) {
                categoryDistribution[category] = {
                    count: 0,
                    total_time: 0
                };
            }
            categoryDistribution[category].count++;
            categoryDistribution[category].total_time += task.total_time || 0;
        });

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            in_progress_tasks: inProgressTasks,
            paused_tasks: pausedTasks,
            pending_tasks: pendingTasks,
            completion_rate: completionRate,
            total_time: totalTime,
            total_time_formatted: this.formatDuration(totalTime),
            category_distribution: categoryDistribution
        };
    }

    static async exportData(userId, format = 'json') {
        const tasks = await Task.findByUserId(userId);
        const timeSessions = await TimeSession.findByUserId(userId);
        
        const data = {
            export_date: new Date().toISOString(),
            user_id: userId,
            tasks: tasks,
            time_sessions: timeSessions,
            summary: {
                total_tasks: tasks.length,
                completed_tasks: tasks.filter(t => t.status === 'completed').length,
                total_time_tracked: tasks.reduce((sum, t) => sum + (t.total_time || 0), 0)
            }
        };

        if (format === 'csv') {
            return this.convertToCSV(tasks);
        }
        
        return data;
    }

    static convertToCSV(tasks) {
        if (!tasks || tasks.length === 0) {
            return 'No data available';
        }

        const headers = ['Title', 'Description', 'Status', 'Priority', 'Category', 'Created At', 'Updated At', 'Total Time (seconds)', 'Tags'];
        const rows = tasks.map(task => [
            task.title || '',
            task.description || '',
            task.status || '',
            task.priority || '',
            task.category || '',
            task.created_at ? task.created_at.toISOString() : '',
            task.updated_at ? task.updated_at.toISOString() : '',
            task.total_time || 0,
            task.tags ? task.tags.join(';') : ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return csvContent;
    }

    static formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0m';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs > 0 ? secs + 's' : ''}`;
        } else {
            return `${secs}s`;
        }
    }
}

module.exports = ReportService;
