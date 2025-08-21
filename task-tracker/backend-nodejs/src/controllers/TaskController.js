const TaskService = require('../services/TaskService');

class TaskController {
    static async getTasks(req, res) {
        try {
            const userId = req.user.id;
            const filters = {};
            
            if (req.query.status) filters.status = req.query.status;
            if (req.query.category) filters.category = req.query.category;
            if (req.query.priority) filters.priority = req.query.priority;
            
            const tasks = await TaskService.getTasks(userId, filters);
            res.json(tasks);
        } catch (error) {
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async getTask(req, res) {
        try {
            const task = await TaskService.getTaskById(req.params.id);
            res.json(task);
        } catch (error) {
            res.status(404).json({
                detail: error.message
            });
        }
    }

    static async createTask(req, res) {
        try {
            const userId = req.user.id;
            const task = await TaskService.createTask(userId, req.body);
            
            res.status(201).json(task);
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async updateTask(req, res) {
        try {
            const task = await TaskService.updateTask(req.params.id, req.body);
            res.json(task);
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async deleteTask(req, res) {
        try {
            await TaskService.deleteTask(req.params.id);
            res.json({
                message: 'Task deleted successfully'
            });
        } catch (error) {
            res.status(404).json({
                detail: error.message
            });
        }
    }

    static async startTask(req, res) {
        console.log('TaskController.startTask called with:', {
            userId: req.user?.id,
            taskId: req.params.id,
            method: req.method,
            path: req.path
        });
        
        try {
            const userId = req.user.id;
            const task = await TaskService.startTask(userId, req.params.id);
            
            res.json({
                message: 'Task started successfully',
                task: task
            });
        } catch (error) {
            console.error('Error in TaskController.startTask:', error.message);
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async pauseTask(req, res) {
        try {
            const task = await TaskService.pauseTask(req.params.id);
            
            res.json({
                message: 'Task paused successfully',
                task: task
            });
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async finishTask(req, res) {
        try {
            const task = await TaskService.finishTask(req.params.id);
            
            res.json({
                message: 'Task completed successfully',
                task: task
            });
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async pauseAllTasks(req, res) {
        try {
            const userId = req.user.id;
            const result = await TaskService.pauseAllTasks(userId);
            
            res.json({
                message: `${result.paused_count} tasks paused successfully`,
                paused_count: result.paused_count
            });
        } catch (error) {
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async getActiveTask(req, res) {
        try {
            const userId = req.user.id;
            const task = await TaskService.getActiveTask(userId);
            
            res.json(task || null);
        } catch (error) {
            res.status(500).json({
                detail: error.message
            });
        }
    }
}

module.exports = TaskController;
