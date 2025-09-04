const Task = require('../models/Task');
const TimeSession = require('../models/TimeSession');

class TaskService {
    static async getTasks(userId, filters = {}) {
        return await Task.findByUserId(userId, filters);
    }

    static async getTaskById(taskId) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        return task;
    }

    static async createTask(userId, taskData) {
        const { title, description, priority = 'medium', status = 'pending', category, tags, notes } = taskData;

        if (!title || !title.trim()) {
            throw new Error('Task title is required');
        }

        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            throw new Error('Invalid priority level');
        }

        const validStatuses = ['pending', 'in_progress', 'paused', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const task = await Task.create({
            user_id: userId,
            title: title.trim(),
            description: description?.trim() || '',
            priority,
            status,
            category: category || null,
            tags: Array.isArray(tags) ? tags : [],
            notes: notes?.trim() || ''
        });

        // If creating task with in_progress status, pause all other user's tasks and start time session
        if (status === 'in_progress') {
            await Task.pauseAllForUser(userId);
            await Task.updateStatus(task._id, 'in_progress'); // Ensure it remains in_progress after pause all

            // Create a new time session
            await TimeSession.create({
                task_id: task._id,
                user_id: userId,
                start_time: new Date()
            });
        }

        return task;
    }

    static async updateTask(taskId, updates) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const oldStatus = task.status;

        // Validate updates
        if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
            throw new Error('Invalid priority level');
        }

        if (updates.status && !['pending', 'in_progress', 'paused', 'completed'].includes(updates.status)) {
            throw new Error('Invalid status');
        }

        const success = await Task.update(taskId, updates);
        if (!success) {
            throw new Error('Failed to update task');
        }

        // Handle status changes
        if (updates.status && updates.status !== oldStatus) {
            if (updates.status === 'in_progress') {
                // If changing to in_progress, pause all other user's tasks and start time session
                await Task.pauseAllForUser(task.user_id);
                await Task.updateStatus(taskId, 'in_progress'); // Ensure it remains in_progress after pause all

                // Create a new time session
                await TimeSession.create({
                    task_id: taskId,
                    user_id: task.user_id,
                    start_time: new Date()
                });
            } else if (oldStatus === 'in_progress') {
                // If changing from in_progress, end the current time session
                const session = await TimeSession.findActiveByTaskId(taskId);
                if (session) {
                    await TimeSession.endSession(session._id);
                }
            }
        }

        return await Task.findById(taskId);
    }

    static async deleteTask(taskId) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const success = await Task.delete(taskId);
        if (!success) {
            throw new Error('Failed to delete task');
        }

        return true;
    }

    static async startTask(userId, taskId) {
        console.log('Starting task:', { userId, taskId, taskIdType: typeof taskId });

        // Check if task exists first
        const existingTask = await Task.findById(taskId);
        console.log('Found task:', existingTask ? 'Yes' : 'No');
        if (!existingTask) {
            throw new Error('Task not found');
        }

        // First, pause all other tasks for this user
        await Task.pauseAllForUser(userId);

        // Start the specified task
        const success = await Task.updateStatus(taskId, 'in_progress');
        if (!success) {
            throw new Error('Failed to start task');
        }

        // Create a new time session
        await TimeSession.create({
            task_id: taskId,
            user_id: userId,
            start_time: new Date()
        });

        return await Task.findById(taskId);
    }

    static async pauseTask(taskId) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (task.status !== 'in_progress') {
            throw new Error('Task is not currently in progress');
        }

        // End the current time session
        const session = await TimeSession.findActiveByTaskId(taskId);
        if (session) {
            await TimeSession.endSession(session._id);
        }

        const success = await Task.updateStatus(taskId, 'paused');
        if (!success) {
            throw new Error('Failed to pause task');
        }

        return await Task.findById(taskId);
    }

    static async finishTask(taskId) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // End any active time session
        const session = await TimeSession.findActiveByTaskId(taskId);
        if (session) {
            await TimeSession.endSession(session._id);
        }

        const success = await Task.updateStatus(taskId, 'completed');
        if (!success) {
            throw new Error('Failed to finish task');
        }

        return await Task.findById(taskId);
    }

    static async pauseAllTasks(userId) {
        // End all active time sessions for the user
        await TimeSession.endAllActiveByUserId(userId);

        const count = await Task.pauseAllForUser(userId);
        return { paused_count: count };
    }

    static async getActiveTask(userId) {
        return await Task.findActiveByUserId(userId);
    }
}

module.exports = TaskService;
