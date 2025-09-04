const Category = require('../models/Category');

class CategoryService {
    static async getCategories(userId) {
        const categories = await Category.findByUserId(userId);
        // Transform _id to id for frontend compatibility
        return categories.map(category => ({
            ...category,
            id: category._id
        }));
    }

    static async getCategoryById(categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        // Transform _id to id for frontend compatibility
        return {
            ...category,
            id: category._id
        };
    }

    static async createCategory(userId, categoryData) {
        const { name, color = '#007bff' } = categoryData;

        if (!name || !name.trim()) {
            throw new Error('Category name is required');
        }

        const category = await Category.create({
            user_id: userId,
            name: name.trim(),
            color: color
        });

        // Transform _id to id for frontend compatibility
        return {
            ...category,
            id: category._id
        };
    }

    static async updateCategory(categoryId, updates) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        const success = await Category.update(categoryId, updates);
        if (!success) {
            throw new Error('Failed to update category');
        }

        const updatedCategory = await Category.findById(categoryId);
        // Transform _id to id for frontend compatibility
        return {
            ...updatedCategory,
            id: updatedCategory._id
        };
    }

    static async deleteCategory(categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        const success = await Category.delete(categoryId);
        if (!success) {
            throw new Error('Failed to delete category');
        }

        return true;
    }

    static async getCategoryStats(userId) {
        const stats = await Category.getCategoryStats(userId);
        // Transform _id to id for frontend compatibility
        return stats.map(stat => ({
            ...stat,
            id: stat._id
        }));
    }
}

module.exports = CategoryService;
