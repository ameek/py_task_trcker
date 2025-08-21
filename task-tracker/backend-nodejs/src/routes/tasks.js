const express = require('express');
const TaskController = require('../controllers/TaskController');
const TaskLinkController = require('../controllers/TaskLinkController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

// Task CRUD operations
router.get('/', TaskController.getTasks);
router.post('/', TaskController.createTask);
router.get('/active', TaskController.getActiveTask);
router.get('/:id', TaskController.getTask);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

// Task flow operations
router.post('/:id/start', TaskController.startTask);
router.post('/:id/pause', TaskController.pauseTask);
router.post('/:id/finish', TaskController.finishTask);
router.post('/pause-all', TaskController.pauseAllTasks);

// Task links
router.get('/:taskId/links', TaskLinkController.getTaskLinks);
router.post('/:taskId/links', TaskLinkController.createTaskLink);
router.delete('/:taskId/links/:linkId', TaskLinkController.deleteTaskLink);

module.exports = router;
