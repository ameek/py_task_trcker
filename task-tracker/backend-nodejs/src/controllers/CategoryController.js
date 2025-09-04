const CategoryService = require('../services/CategoryService');

class CategoryController {
    static async getCategories(req, res) {
        try {
            const userId = req.user.id;
            const categories = await CategoryService.getCategories(userId);
            res.json(categories);
        } catch (error) {
            res.status(500).json({
                detail: error.message
            });
        }
    }

    static async getCategory(req, res) {
        try {
            const category = await CategoryService.getCategoryById(req.params.id);
            res.json(category);
        } catch (error) {
            res.status(404).json({
                detail: error.message
            });
        }
    }

    static async createCategory(req, res) {
        try {
            const userId = req.user.id;
            const category = await CategoryService.createCategory(userId, req.body);

            res.status(201).json(category);
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async updateCategory(req, res) {
        try {
            const category = await CategoryService.updateCategory(req.params.id, req.body);
            res.json(category);
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async deleteCategory(req, res) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            res.json({
                message: 'Category deleted successfully'
            });
        } catch (error) {
            res.status(404).json({
                detail: error.message
            });
        }
    }

    static async getCategoryStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await CategoryService.getCategoryStats(userId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({
                detail: error.message
            });
        }
    }
}

module.exports = CategoryController;
