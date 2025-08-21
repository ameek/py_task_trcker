const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Configuration
const PORT = process.env.PORT || 8000;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:password@localhost:27017/task_tracker?authSource=admin';
const DATABASE_NAME = process.env.DATABASE_NAME || 'task_tracker';

// Global variables
let db;
let currentUserId = null; // Simplified authentication - stores current user ID

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'] // Add x-user-id to allowed headers
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database connection
async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        db = client.db(DATABASE_NAME);
        
        // Test connection
        await db.admin().ping();
        console.log('Successfully connected to MongoDB');
        
        // Create indexes
        await createIndexes();
        
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

async function createIndexes() {
    try {
        // User email index (unique)
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        
        // Task indexes
        await db.collection('tasks').createIndex({ user_id: 1 });
        await db.collection('tasks').createIndex({ status: 1 });
        await db.collection('tasks').createIndex({ created_at: 1 });
        await db.collection('tasks').createIndex({ category: 1 });
        
        // Category indexes
        await db.collection('categories').createIndex({ user_id: 1 });
        await db.collection('categories').createIndex({ name: 1 });
        
        // Task links indexes
        await db.collection('task_links').createIndex({ task_id: 1 });
        await db.collection('task_links').createIndex({ user_id: 1 });
        
        // Time session indexes
        await db.collection('time_sessions').createIndex({ task_id: 1 });
        await db.collection('time_sessions').createIndex({ user_id: 1 });
        await db.collection('time_sessions').createIndex({ is_active: 1 });
        await db.collection('time_sessions').createIndex({ started_at: 1 });
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.warn('Failed to create indexes:', error.message);
    }
}

// Utility functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateTaskStatus(status) {
    return ['pending', 'in_progress', 'paused', 'completed'].includes(status);
}

function validateTaskPriority(priority) {
    return ['low', 'medium', 'high'].includes(priority);
}

// Authentication middleware (simplified) - allows requests without auth for demo
function requireAuth(req, res, next) {
    // For demo purposes, allow requests without proper authentication
    // In production, this should be a proper JWT-based authentication
    if (currentUserId) {
        req.userId = currentUserId;
        console.log('Using currentUserId:', currentUserId);
        next();
    } else {
        // Try to extract user ID from headers
        const userIdFromHeader = req.headers['x-user-id'];
        if (userIdFromHeader) {
            req.userId = userIdFromHeader;
            currentUserId = userIdFromHeader; // Set for consistency
            console.log('Using header userId:', userIdFromHeader);
            next();
        } else {
            console.log('No authentication found');
            return res.status(401).json({ detail: 'Not authenticated' });
        }
    }
}

// Error handler
function handleError(res, error, message = 'Internal server error') {
    console.error(`Error: ${message}`, error);
    res.status(500).json({ detail: message });
}

// Routes

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Task Tracker API',
        version: '2.0.0',
        docs: '/docs',
        status: 'healthy'
    });
});

// Authentication endpoints

// Register
app.post('/auth/register', async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        
        // Validation
        if (!full_name || !email || !password) {
            return res.status(400).json({ detail: 'All fields are required' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ detail: 'Invalid email format' });
        }
        
        if (password.length < 4) {
            return res.status(400).json({ detail: 'Password must be at least 4 characters' });
        }
        
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ detail: 'Email already registered' });
        }
        
        // Create user
        const userData = {
            email,
            full_name,
            password, // Store as plain text (simplified)
            created_at: new Date()
        };
        
        const result = await db.collection('users').insertOne(userData);
        
        // Set current user (simplified authentication)
        currentUserId = result.insertedId.toString();
        
        const userResponse = {
            _id: result.insertedId.toString(), // Include _id for frontend compatibility
            id: result.insertedId.toString(),
            email: userData.email,
            full_name: userData.full_name,
            created_at: userData.created_at
        };
        
        res.json({
            message: 'User registered successfully',
            user: userResponse
        });
        
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ detail: 'Email already registered' });
        } else {
            handleError(res, error, 'Registration failed');
        }
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body; // Get from body instead of query
        
        if (!email || !password) {
            return res.status(400).json({ detail: 'Email and password are required' });
        }
        
        // Find user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(401).json({ detail: 'Invalid email or password' });
        }
        
        // Check password (plain text comparison - simplified)
        if (user.password !== password) {
            return res.status(401).json({ detail: 'Invalid email or password' });
        }
        
        // Set current user (simplified authentication)
        currentUserId = user._id.toString();
        
        const userResponse = {
            _id: user._id.toString(), // Include _id for frontend compatibility
            id: user._id.toString(),
            email: user.email,
            full_name: user.full_name,
            created_at: user.created_at
        };
        
        res.json({
            message: 'Login successful',
            user: userResponse
        });
        
    } catch (error) {
        handleError(res, error, 'Login failed');
    }
});

// Get current user
app.get('/auth/me', requireAuth, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }
        
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            full_name: user.full_name,
            created_at: user.created_at
        };
        
        res.json(userResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get user');
    }
});

// Task endpoints

// Get all tasks
app.get('/tasks/', requireAuth, async (req, res) => {
    try {
        const { skip = 0, limit = 100 } = req.query;
        
        const tasks = await db.collection('tasks')
            .find({ user_id: req.userId })
            .sort({ created_at: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .toArray();
        
        const tasksResponse = tasks.map(task => ({
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            category: task.category || '',
            tags: task.tags || [],
            notes: task.notes || '',
            user_id: task.user_id,
            created_at: task.created_at,
            updated_at: task.updated_at,
            total_time: task.total_time || 0
        }));
        
        res.json(tasksResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get tasks');
    }
});

// Create task
app.post('/tasks/', requireAuth, async (req, res) => {
    try {
        const { title, description, status = 'pending', priority = 'medium', category, tags, notes, links } = req.body;
        
        // Validation
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ detail: 'Task title is required' });
        }
        
        if (!validateTaskStatus(status)) {
            return res.status(400).json({ detail: 'Invalid task status' });
        }
        
        if (!validateTaskPriority(priority)) {
            return res.status(400).json({ detail: 'Invalid task priority' });
        }
        
        const now = new Date();
        const taskData = {
            title: title.trim(),
            description: description ? description.trim() : '',
            status,
            priority,
            category: category || '',
            tags: tags || [],
            notes: notes || '',
            user_id: req.userId,
            created_at: now,
            updated_at: now,
            total_time: 0
        };
        
        const result = await db.collection('tasks').insertOne(taskData);
        
        // Handle task links if provided
        if (links && Array.isArray(links) && links.length > 0) {
            const linkDocs = links.map(link => ({
                task_id: result.insertedId.toString(),
                user_id: req.userId,
                url: link.url,
                title: link.title || '',
                description: link.description || '',
                created_at: now
            }));
            await db.collection('task_links').insertMany(linkDocs);
        }
        
        const taskResponse = {
            id: result.insertedId.toString(),
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority,
            category: taskData.category,
            tags: taskData.tags,
            notes: taskData.notes,
            user_id: taskData.user_id,
            created_at: taskData.created_at,
            updated_at: taskData.updated_at,
            total_time: taskData.total_time
        };
        
        res.status(201).json(taskResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to create task');
    }
});

// Get single task
app.get('/tasks/:taskId', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }
        
        const task = await db.collection('tasks').findOne({
            _id: new ObjectId(taskId),
            user_id: req.userId
        });
        
        if (!task) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        
        const taskResponse = {
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            user_id: task.user_id,
            created_at: task.created_at,
            updated_at: task.updated_at
        };
        
        res.json(taskResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get task');
    }
});

// Update task
app.put('/tasks/:taskId', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, priority } = req.body;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }
        
        // Build update object
        const updateData = { updated_at: new Date() };
        
        if (title !== undefined) {
            if (!title || title.trim().length === 0) {
                return res.status(400).json({ detail: 'Task title cannot be empty' });
            }
            updateData.title = title.trim();
        }
        
        if (description !== undefined) {
            updateData.description = description ? description.trim() : '';
        }
        
        if (status !== undefined) {
            if (!validateTaskStatus(status)) {
                return res.status(400).json({ detail: 'Invalid task status' });
            }
            updateData.status = status;
        }
        
        if (priority !== undefined) {
            if (!validateTaskPriority(priority)) {
                return res.status(400).json({ detail: 'Invalid task priority' });
            }
            updateData.priority = priority;
        }
        
        const result = await db.collection('tasks').updateOne(
            { _id: new ObjectId(taskId), user_id: req.userId },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        
        // Get updated task
        const updatedTask = await db.collection('tasks').findOne({
            _id: new ObjectId(taskId),
            user_id: req.userId
        });
        
        const taskResponse = {
            id: updatedTask._id.toString(),
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
            user_id: updatedTask.user_id,
            created_at: updatedTask.created_at,
            updated_at: updatedTask.updated_at
        };
        
        res.json(taskResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to update task');
    }
});

// Delete task
app.delete('/tasks/:taskId', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }
        
        const result = await db.collection('tasks').deleteOne({
            _id: new ObjectId(taskId),
            user_id: req.userId
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        
        res.status(204).send();
        
    } catch (error) {
        handleError(res, error, 'Failed to delete task');
    }
});

// Get tasks by status
app.get('/tasks/status/:status', requireAuth, async (req, res) => {
    try {
        const { status } = req.params;
        
        if (!validateTaskStatus(status)) {
            return res.status(400).json({ detail: 'Invalid status' });
        }
        
        const tasks = await db.collection('tasks')
            .find({ user_id: req.userId, status })
            .sort({ created_at: -1 })
            .toArray();
        
        const tasksResponse = tasks.map(task => ({
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            user_id: task.user_id,
            created_at: task.created_at,
            updated_at: task.updated_at,
            total_time: task.total_time || 0
        }));
        
        res.json(tasksResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get tasks by status');
    }
});

// Task management endpoints for focus and time tracking

// Start task (automatically pauses other active tasks)
app.post('/tasks/:taskId/start', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        
        console.log('Start task request - taskId:', taskId, 'userId:', req.userId);
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }

        // Check if task exists for this user
        const existingTask = await db.collection('tasks').findOne({
            _id: new ObjectId(taskId),
            user_id: req.userId
        });
        
        console.log('Existing task found:', !!existingTask);
        if (!existingTask) {
            return res.status(404).json({ detail: 'Task not found' });
        }

        // First, pause all active tasks for this user
        await db.collection('tasks').updateMany(
            { user_id: req.userId, status: 'in_progress' },
            { $set: { status: 'paused', updated_at: new Date() } }
        );

        // Now start the selected task
        const result = await db.collection('tasks').findOneAndUpdate(
            { _id: new ObjectId(taskId), user_id: req.userId },
            { 
                $set: { 
                    status: 'in_progress', 
                    updated_at: new Date(),
                    last_started: new Date()
                } 
            },
            { returnDocument: 'after' }
        );

        console.log('Update result:', !!result);
        if (!result) {
            return res.status(404).json({ detail: 'Task not found' });
        }

        // Create a time session
        await db.collection('time_sessions').insertOne({
            task_id: taskId,
            user_id: req.userId,
            started_at: new Date(),
            is_active: true
        });

        const taskResponse = {
            id: result._id.toString(),
            title: result.title,
            description: result.description,
            status: result.status,
            priority: result.priority,
            user_id: result.user_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
            total_time: result.total_time || 0
        };

        res.json(taskResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to start task');
    }
});

// Pause task
app.post('/tasks/:taskId/pause', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }

        // Update the task status
        const result = await db.collection('tasks').findOneAndUpdate(
            { _id: new ObjectId(taskId), user_id: req.userId },
            { $set: { status: 'paused', updated_at: new Date() } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ detail: 'Task not found' });
        }

        // End the active time session
        const now = new Date();
        const activeSession = await db.collection('time_sessions').findOne({
            task_id: taskId,
            user_id: req.userId,
            is_active: true
        });

        if (activeSession) {
            const duration = Math.floor((now - activeSession.started_at) / 1000); // duration in seconds
            
            await db.collection('time_sessions').updateOne(
                { _id: activeSession._id },
                { 
                    $set: { 
                        ended_at: now,
                        duration_seconds: duration,
                        is_active: false
                    }
                }
            );

            // Update total time on task
            await db.collection('tasks').updateOne(
                { _id: new ObjectId(taskId) },
                { $inc: { total_time: duration } }
            );
        }

        const taskResponse = {
            id: result._id.toString(),
            title: result.title,
            description: result.description,
            status: result.status,
            priority: result.priority,
            user_id: result.user_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
            total_time: (result.total_time || 0) + (activeSession ? Math.floor((now - activeSession.started_at) / 1000) : 0)
        };

        res.json(taskResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to pause task');
    }
});

// Finish task (mark as completed)
app.post('/tasks/:taskId/finish', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { notes } = req.body;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }

        // End any active time session first
        const now = new Date();
        const activeSession = await db.collection('time_sessions').findOne({
            task_id: taskId,
            user_id: req.userId,
            is_active: true
        });

        if (activeSession) {
            const duration = Math.floor((now - activeSession.started_at) / 1000);
            
            await db.collection('time_sessions').updateOne(
                { _id: activeSession._id },
                { 
                    $set: { 
                        ended_at: now,
                        duration_seconds: duration,
                        is_active: false,
                        notes: notes || ''
                    }
                }
            );

            // Update total time on task
            await db.collection('tasks').updateOne(
                { _id: new ObjectId(taskId) },
                { $inc: { total_time: duration } }
            );
        }

        // Update the task status to completed
        const result = await db.collection('tasks').findOneAndUpdate(
            { _id: new ObjectId(taskId), user_id: req.userId },
            { 
                $set: { 
                    status: 'completed', 
                    updated_at: now,
                    completed_at: now
                } 
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ detail: 'Task not found' });
        }

        const taskResponse = {
            id: result._id.toString(),
            title: result.title,
            description: result.description,
            status: result.status,
            priority: result.priority,
            user_id: result.user_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
            completed_at: result.completed_at,
            total_time: result.total_time || 0
        };

        res.json(taskResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to finish task');
    }
});

// Pause all tasks
app.post('/tasks/pause-all', requireAuth, async (req, res) => {
    try {
        // Pause all active tasks
        await db.collection('tasks').updateMany(
            { user_id: req.userId, status: 'in_progress' },
            { $set: { status: 'paused', updated_at: new Date() } }
        );

        // End all active time sessions
        const now = new Date();
        const activeSessions = await db.collection('time_sessions').find({
            user_id: req.userId,
            is_active: true
        }).toArray();

        for (const session of activeSessions) {
            const duration = Math.floor((now - session.started_at) / 1000);
            
            await db.collection('time_sessions').updateOne(
                { _id: session._id },
                { 
                    $set: { 
                        ended_at: now,
                        duration_seconds: duration,
                        is_active: false
                    }
                }
            );

            // Update total time on task
            await db.collection('tasks').updateOne(
                { _id: new ObjectId(session.task_id) },
                { $inc: { total_time: duration } }
            );
        }

        res.json({ message: 'All tasks paused successfully' });
        
    } catch (error) {
        handleError(res, error, 'Failed to pause all tasks');
    }
});

// Get active task
app.get('/tasks/active', requireAuth, async (req, res) => {
    try {
        const activeTask = await db.collection('tasks').findOne({
            user_id: req.userId,
            status: 'in_progress'
        });

        if (!activeTask) {
            return res.json({ active_task: null });
        }

        const taskResponse = {
            id: activeTask._id.toString(),
            title: activeTask.title,
            description: activeTask.description,
            status: activeTask.status,
            priority: activeTask.priority,
            user_id: activeTask.user_id,
            created_at: activeTask.created_at,
            updated_at: activeTask.updated_at,
            total_time: activeTask.total_time || 0
        };

        res.json({ active_task: taskResponse });
        
    } catch (error) {
        handleError(res, error, 'Failed to get active task');
    }
});

// Get time sessions for a task
app.get('/tasks/:taskId/sessions', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }

        const sessions = await db.collection('time_sessions')
            .find({ task_id: taskId, user_id: req.userId })
            .sort({ started_at: -1 })
            .toArray();

        const sessionsResponse = sessions.map(session => ({
            id: session._id.toString(),
            task_id: session.task_id,
            started_at: session.started_at,
            ended_at: session.ended_at,
            duration_seconds: session.duration_seconds || 0,
            is_active: session.is_active || false,
            notes: session.notes || ''
        }));

        res.json(sessionsResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get time sessions');
    }
});

// Get daily productivity summary
app.get('/reports/daily/:date?', requireAuth, async (req, res) => {
    try {
        const dateParam = req.params.date;
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        
        // Set to start and end of day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get completed tasks for the day
        const completedTasks = await db.collection('tasks').find({
            user_id: req.userId,
            status: 'completed',
            completed_at: { $gte: startOfDay, $lte: endOfDay }
        }).toArray();

        // Get time sessions for the day
        const sessions = await db.collection('time_sessions').find({
            user_id: req.userId,
            started_at: { $gte: startOfDay, $lte: endOfDay }
        }).toArray();

        const totalTime = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);

        const summary = {
            date: targetDate.toISOString().split('T')[0],
            completed_tasks: completedTasks.length,
            total_time_seconds: totalTime,
            total_time_formatted: formatDuration(totalTime),
            tasks: completedTasks.map(task => ({
                id: task._id.toString(),
                title: task.title,
                priority: task.priority,
                completed_at: task.completed_at
            }))
        };

        res.json(summary);
        
    } catch (error) {
        handleError(res, error, 'Failed to get daily summary');
    }
});

// Helper function to format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Category Management Endpoints

// Get all categories
app.get('/categories/', requireAuth, async (req, res) => {
    try {
        const categories = await db.collection('categories')
            .find({ user_id: req.userId })
            .sort({ name: 1 })
            .toArray();
        
        const categoriesResponse = categories.map(cat => ({
            id: cat._id.toString(),
            name: cat.name,
            color: cat.color,
            description: cat.description,
            user_id: cat.user_id,
            created_at: cat.created_at
        }));
        
        res.json(categoriesResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get categories');
    }
});

// Create category
app.post('/categories/', requireAuth, async (req, res) => {
    try {
        const { name, color = '#007bff', description = '' } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ detail: 'Category name is required' });
        }
        
        // Check if category already exists for this user
        const existing = await db.collection('categories').findOne({
            user_id: req.userId,
            name: name.trim()
        });
        
        if (existing) {
            return res.status(400).json({ detail: 'Category already exists' });
        }
        
        const now = new Date();
        const categoryData = {
            name: name.trim(),
            color: color,
            description: description.trim(),
            user_id: req.userId,
            created_at: now
        };
        
        const result = await db.collection('categories').insertOne(categoryData);
        
        const categoryResponse = {
            id: result.insertedId.toString(),
            name: categoryData.name,
            color: categoryData.color,
            description: categoryData.description,
            user_id: categoryData.user_id,
            created_at: categoryData.created_at
        };
        
        res.status(201).json(categoryResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to create category');
    }
});

// Update category
app.put('/categories/:categoryId', requireAuth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, color, description } = req.body;
        
        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ detail: 'Invalid category ID' });
        }
        
        const updateData = { updated_at: new Date() };
        if (name) updateData.name = name.trim();
        if (color) updateData.color = color;
        if (description !== undefined) updateData.description = description.trim();
        
        const result = await db.collection('categories').findOneAndUpdate(
            { _id: new ObjectId(categoryId), user_id: req.userId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result.value) {
            return res.status(404).json({ detail: 'Category not found' });
        }
        
        const categoryResponse = {
            id: result.value._id.toString(),
            name: result.value.name,
            color: result.value.color,
            description: result.value.description,
            user_id: result.value.user_id,
            created_at: result.value.created_at
        };
        
        res.json(categoryResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to update category');
    }
});

// Delete category
app.delete('/categories/:categoryId', requireAuth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        if (!ObjectId.isValid(categoryId)) {
            return res.status(400).json({ detail: 'Invalid category ID' });
        }
        
        // Check if category is in use
        const tasksUsingCategory = await db.collection('tasks').countDocuments({
            user_id: req.userId,
            category: categoryId
        });
        
        if (tasksUsingCategory > 0) {
            return res.status(400).json({ detail: 'Cannot delete category that is in use by tasks' });
        }
        
        const result = await db.collection('categories').deleteOne({
            _id: new ObjectId(categoryId),
            user_id: req.userId
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ detail: 'Category not found' });
        }
        
        res.status(204).send();
        
    } catch (error) {
        handleError(res, error, 'Failed to delete category');
    }
});

// Task Links Management

// Get task links
app.get('/tasks/:taskId/links', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }
        
        // Verify task ownership
        const task = await db.collection('tasks').findOne({
            _id: new ObjectId(taskId),
            user_id: req.userId
        });
        
        if (!task) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        
        const links = await db.collection('task_links')
            .find({ task_id: taskId, user_id: req.userId })
            .sort({ created_at: 1 })
            .toArray();
        
        const linksResponse = links.map(link => ({
            id: link._id.toString(),
            task_id: link.task_id,
            url: link.url,
            title: link.title,
            description: link.description,
            created_at: link.created_at
        }));
        
        res.json(linksResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to get task links');
    }
});

// Add task link
app.post('/tasks/:taskId/links', requireAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { url, title = '', description = '' } = req.body;
        
        if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ detail: 'Invalid task ID' });
        }
        
        if (!url || url.trim().length === 0) {
            return res.status(400).json({ detail: 'URL is required' });
        }
        
        // Verify task ownership
        const task = await db.collection('tasks').findOne({
            _id: new ObjectId(taskId),
            user_id: req.userId
        });
        
        if (!task) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        
        const now = new Date();
        const linkData = {
            task_id: taskId,
            user_id: req.userId,
            url: url.trim(),
            title: title.trim(),
            description: description.trim(),
            created_at: now
        };
        
        const result = await db.collection('task_links').insertOne(linkData);
        
        const linkResponse = {
            id: result.insertedId.toString(),
            task_id: linkData.task_id,
            url: linkData.url,
            title: linkData.title,
            description: linkData.description,
            created_at: linkData.created_at
        };
        
        res.status(201).json(linkResponse);
        
    } catch (error) {
        handleError(res, error, 'Failed to add task link');
    }
});

// Delete task link
app.delete('/tasks/:taskId/links/:linkId', requireAuth, async (req, res) => {
    try {
        const { taskId, linkId } = req.params;
        
        if (!ObjectId.isValid(taskId) || !ObjectId.isValid(linkId)) {
            return res.status(400).json({ detail: 'Invalid ID' });
        }
        
        const result = await db.collection('task_links').deleteOne({
            _id: new ObjectId(linkId),
            task_id: taskId,
            user_id: req.userId
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ detail: 'Link not found' });
        }
        
        res.status(204).send();
        
    } catch (error) {
        handleError(res, error, 'Failed to delete task link');
    }
});

// Reports and Analytics

// Get weekly productivity report
app.get('/reports/weekly/:date?', requireAuth, async (req, res) => {
    try {
        const dateParam = req.params.date;
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        
        // Get start of week (Monday)
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Get completed tasks for the week
        const completedTasks = await db.collection('tasks').find({
            user_id: req.userId,
            status: 'completed',
            completed_at: { $gte: startOfWeek, $lte: endOfWeek }
        }).toArray();
        
        // Get time sessions for the week
        const sessions = await db.collection('time_sessions').find({
            user_id: req.userId,
            started_at: { $gte: startOfWeek, $lte: endOfWeek }
        }).toArray();
        
        const totalTime = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
        
        // Group by day
        const dailyStats = {};
        for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split('T')[0];
            dailyStats[dayKey] = {
                completed_tasks: 0,
                total_time: 0,
                tasks: []
            };
        }
        
        completedTasks.forEach(task => {
            const dayKey = task.completed_at.toISOString().split('T')[0];
            if (dailyStats[dayKey]) {
                dailyStats[dayKey].completed_tasks++;
                dailyStats[dayKey].tasks.push({
                    id: task._id.toString(),
                    title: task.title,
                    priority: task.priority,
                    category: task.category
                });
            }
        });
        
        sessions.forEach(session => {
            const dayKey = session.started_at.toISOString().split('T')[0];
            if (dailyStats[dayKey]) {
                dailyStats[dayKey].total_time += session.duration_seconds || 0;
            }
        });
        
        const summary = {
            week_start: startOfWeek.toISOString().split('T')[0],
            week_end: endOfWeek.toISOString().split('T')[0],
            total_completed_tasks: completedTasks.length,
            total_time_seconds: totalTime,
            total_time_formatted: formatDuration(totalTime),
            daily_stats: dailyStats
        };
        
        res.json(summary);
        
    } catch (error) {
        handleError(res, error, 'Failed to get weekly report');
    }
});

// Get completion statistics
app.get('/reports/stats', requireAuth, async (req, res) => {
    try {
        const totalTasks = await db.collection('tasks').countDocuments({ user_id: req.userId });
        const completedTasks = await db.collection('tasks').countDocuments({ user_id: req.userId, status: 'completed' });
        const pendingTasks = await db.collection('tasks').countDocuments({ user_id: req.userId, status: 'pending' });
        const inProgressTasks = await db.collection('tasks').countDocuments({ user_id: req.userId, status: 'in_progress' });
        const pausedTasks = await db.collection('tasks').countDocuments({ user_id: req.userId, status: 'paused' });
        
        // Get total time across all tasks
        const allTasks = await db.collection('tasks').find({ user_id: req.userId }).toArray();
        const totalTimeSeconds = allTasks.reduce((sum, task) => sum + (task.total_time || 0), 0);
        
        // Get category distribution
        const categoryStats = {};
        allTasks.forEach(task => {
            const cat = task.category || 'Uncategorized';
            if (!categoryStats[cat]) {
                categoryStats[cat] = { count: 0, total_time: 0 };
            }
            categoryStats[cat].count++;
            categoryStats[cat].total_time += task.total_time || 0;
        });
        
        const stats = {
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            pending_tasks: pendingTasks,
            in_progress_tasks: inProgressTasks,
            paused_tasks: pausedTasks,
            completion_rate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0.0',
            total_time_seconds: totalTimeSeconds,
            total_time_formatted: formatDuration(totalTimeSeconds),
            category_distribution: categoryStats
        };
        
        res.json(stats);
        
    } catch (error) {
        handleError(res, error, 'Failed to get completion statistics');
    }
});

// Export data
app.get('/reports/export/:format?', requireAuth, async (req, res) => {
    try {
        const format = req.params.format || 'json';
        
        if (!['json', 'csv'].includes(format)) {
            return res.status(400).json({ detail: 'Invalid format. Use json or csv' });
        }
        
        // Get all user data
        const tasks = await db.collection('tasks').find({ user_id: req.userId }).toArray();
        const sessions = await db.collection('time_sessions').find({ user_id: req.userId }).toArray();
        const categories = await db.collection('categories').find({ user_id: req.userId }).toArray();
        
        if (format === 'json') {
            const exportData = {
                export_date: new Date().toISOString(),
                user_id: req.userId,
                tasks: tasks.map(task => ({
                    id: task._id.toString(),
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    category: task.category,
                    tags: task.tags,
                    notes: task.notes,
                    total_time: task.total_time,
                    created_at: task.created_at,
                    updated_at: task.updated_at,
                    completed_at: task.completed_at
                })),
                time_sessions: sessions.map(session => ({
                    id: session._id.toString(),
                    task_id: session.task_id,
                    started_at: session.started_at,
                    ended_at: session.ended_at,
                    duration_seconds: session.duration_seconds,
                    notes: session.notes
                })),
                categories: categories.map(cat => ({
                    id: cat._id.toString(),
                    name: cat.name,
                    color: cat.color,
                    description: cat.description,
                    created_at: cat.created_at
                }))
            };
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="task_tracker_export_${new Date().toISOString().split('T')[0]}.json"`);
            res.json(exportData);
        } else {
            // CSV format for tasks
            const csvHeaders = 'ID,Title,Description,Status,Priority,Category,Total Time (seconds),Created,Updated,Completed\n';
            const csvRows = tasks.map(task => [
                task._id.toString(),
                `"${task.title.replace(/"/g, '""')}"`,
                `"${(task.description || '').replace(/"/g, '""')}"`,
                task.status,
                task.priority,
                task.category || '',
                task.total_time || 0,
                task.created_at.toISOString(),
                task.updated_at.toISOString(),
                task.completed_at ? task.completed_at.toISOString() : ''
            ].join(',')).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="task_tracker_export_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvHeaders + csvRows);
        }
        
    } catch (error) {
        handleError(res, error, 'Failed to export data');
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ detail: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ detail: 'Not found' });
});

// Start server
async function startServer() {
    try {
        await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Task Tracker API running on http://0.0.0.0:${PORT}`);
            console.log(`📱 Health check: http://localhost:${PORT}/`);
            console.log(`📖 Database: ${DATABASE_NAME}`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

// Start the server
startServer();
