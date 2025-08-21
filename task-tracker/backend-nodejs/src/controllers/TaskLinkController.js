const TaskLinkService = require('../services/TaskLinkService');

class TaskLinkController {
    static async getTaskLinks(req, res) {
        try {
            const taskId = req.params.taskId;
            const links = await TaskLinkService.getTaskLinks(taskId);
            res.json(links);
        } catch (error) {
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async createTaskLink(req, res) {
        try {
            const taskId = req.params.taskId;
            const link = await TaskLinkService.createTaskLink(taskId, req.body);
            
            res.status(201).json(link);
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async deleteTaskLink(req, res) {
        try {
            await TaskLinkService.deleteTaskLink(req.params.linkId);
            res.json({
                message: 'Link deleted successfully'
            });
        } catch (error) {
            res.status(404).json({
                detail: error.message
            });
        }
    }
}

module.exports = TaskLinkController;
