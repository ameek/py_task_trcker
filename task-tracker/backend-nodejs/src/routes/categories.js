const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All category routes require authentication
router.use(authMiddleware);

// Category CRUD operations
router.get('/', CategoryController.getCategories);
router.post('/', CategoryController.createCategory);
router.get('/stats', CategoryController.getCategoryStats);
router.get('/:id', CategoryController.getCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;
