const ReportService = require('../services/ReportService');

class ReportController {
    static async getDailyReport(req, res) {
        try {
            const userId = req.user.id;
            const date = req.query.date ? new Date(req.query.date) : new Date();
            
            const report = await ReportService.getDailyReport(userId, date);
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
            const userId = req.user.id;
            const report = await ReportService.getWeeklyReport(userId);
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
            const userId = req.user.id;
            const stats = await ReportService.getCompletionStats(userId);
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
            const userId = req.user.id;
            const format = req.params.format || 'json';
            
            if (!['json', 'csv'].includes(format)) {
                return res.status(400).json({
                    detail: 'Invalid format. Supported formats: json, csv'
                });
            }

            const data = await ReportService.exportData(userId, format);
            
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
