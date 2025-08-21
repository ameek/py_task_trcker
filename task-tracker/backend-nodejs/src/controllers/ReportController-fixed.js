const ReportService = require('../services/ReportService');
const { ObjectId } = require('mongodb');

class ReportController {
    static async getDailyReport(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(401).json({ detail: 'User authentication required' });
            }

            const date = req.query.date ? new Date(req.query.date) : new Date();
            
            const report = await ReportService.getDailyReport(new ObjectId(userId), date);
            res.json(report);
        } catch (error) {
            console.error('Error getting daily report:', error);
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async getWeeklyReport(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(401).json({ detail: 'User authentication required' });
            }

            const report = await ReportService.getWeeklyReport(new ObjectId(userId));
            res.json(report);
        } catch (error) {
            console.error('Error getting weekly report:', error);
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async getCompletionStats(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(401).json({ detail: 'User authentication required' });
            }

            const stats = await ReportService.getCompletionStats(new ObjectId(userId));
            res.json(stats);
        } catch (error) {
            console.error('Error getting completion stats:', error);
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async exportData(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(401).json({ detail: 'User authentication required' });
            }

            const format = req.params.format || 'json';
            
            if (!['json', 'csv'].includes(format)) {
                return res.status(400).json({
                    detail: 'Invalid format. Supported formats: json, csv'
                });
            }

            const data = await ReportService.exportData(new ObjectId(userId), format);
            
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=tasks_export.csv');
                res.send(data);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename=tasks_export.json');
                res.json(data);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            res.status(500).json({
                detail: error.message
            });
        }
    }
}

module.exports = ReportController;
