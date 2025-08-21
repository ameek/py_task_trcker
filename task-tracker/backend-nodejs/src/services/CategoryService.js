const Category = require('../models/Category');

class CategoryService {
    static async getCategories(userId) {
        return await Category.findByUserId(userId);
    }

    static async getCategoryById(categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
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

        return category;
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

        return await Category.findById(categoryId);
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
        return await Category.getCategoryStats(userId);
    }
}

module.exports = CategoryService;
