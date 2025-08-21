const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.dbName = process.env.DB_NAME || 'task_tracker';
    }

    async connect() {
        try {
            this.client = new MongoClient(this.url);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            
            console.log('Successfully connected to MongoDB');
            await this.createIndexes();
            console.log('Database indexes created successfully');
            
            return this.db;
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async createIndexes() {
        if (!this.db) throw new Error('Database not connected');

        try {
            // Create indexes for better performance
            await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
            await this.db.collection('tasks').createIndex({ user_id: 1 });
            await this.db.collection('tasks').createIndex({ status: 1 });
            await this.db.collection('tasks').createIndex({ category: 1 });
            await this.db.collection('tasks').createIndex({ created_at: -1 });
            await this.db.collection('categories').createIndex({ user_id: 1 });
            await this.db.collection('task_links').createIndex({ task_id: 1 });
            await this.db.collection('time_sessions').createIndex({ task_id: 1 });
            await this.db.collection('time_sessions').createIndex({ user_id: 1 });
        } catch (error) {
            console.warn('Warning: Could not create database indexes:', error.message);
            // Don't throw error, just log warning as indexes are not critical for basic functionality
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

module.exports = new Database();
