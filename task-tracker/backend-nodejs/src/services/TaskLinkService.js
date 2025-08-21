const TaskLink = require('../models/TaskLink');

class TaskLinkService {
    static async getTaskLinks(taskId) {
        return await TaskLink.findByTaskId(taskId);
    }

    static async createTaskLink(taskId, linkData) {
        const { url, title } = linkData;

        if (!url || !url.trim()) {
            throw new Error('Link URL is required');
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (error) {
            throw new Error('Invalid URL format');
        }

        const link = await TaskLink.create({
            task_id: taskId,
            url: url.trim(),
            title: title?.trim() || ''
        });

        return link;
    }

    static async deleteTaskLink(linkId) {
        const link = await TaskLink.findById(linkId);
        if (!link) {
            throw new Error('Link not found');
        }

        const success = await TaskLink.delete(linkId);
        if (!success) {
            throw new Error('Failed to delete link');
        }

        return true;
    }

    static async deleteAllTaskLinks(taskId) {
        return await TaskLink.deleteByTaskId(taskId);
    }
}

module.exports = TaskLinkService;
