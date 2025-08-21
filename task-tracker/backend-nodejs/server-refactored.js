const express = require('express');
const cors = require('cors');
const database = require('./src/config/database');

// Route imports
const authRoutes = require('./src/routes/auth');
const taskRoutes = require('./src/routes/tasks');
const categoryRoutes = require('./src/routes/categories');
const reportRoutes = require('./src/routes/reports');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8000;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS configuration
        const corsOptions = {
            origin: [
                'http://localhost:3000',
                'http://localhost:3002',
                'http://127.0.0.1:3002',
                'http://localhost:8080',
                'http://127.0.0.1:8080'
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'x-user-id']
        };
        this.app.use(cors(corsOptions));
        // Handle preflight requests
        this.app.options('*', cors(corsOptions));

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/', (req, res) => {
            res.json({
                message: '🚀 Task Tracker API is running!',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'task_tracker'
            });
        });

        // API routes
        this.app.use('/auth', authRoutes);
        this.app.use('/tasks', taskRoutes);
        this.app.use('/categories', categoryRoutes);
        this.app.use('/reports', reportRoutes);

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                detail: `Route ${req.method} ${req.path} not found`
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            
            res.status(err.status || 500).json({
                detail: err.message || 'Internal server error'
            });
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nShutting down gracefully...');
            await database.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\nShutting down gracefully...');
            await database.close();
            process.exit(0);
        });
    }

    async start() {
        try {
            // Connect to database
            await database.connect();
            
            // Start server
            this.app.listen(this.port, '0.0.0.0', () => {
                console.log(`🚀 Task Tracker API running on http://0.0.0.0:${this.port}`);
                console.log(`📱 Health check: http://localhost:${this.port}/`);
                console.log(`📖 Database: ${database.dbName}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Start the server
if (require.main === module) {
    const server = new Server();
    server.start();
}

module.exports = Server;
