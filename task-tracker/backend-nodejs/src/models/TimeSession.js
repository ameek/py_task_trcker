const { ObjectId } = require('mongodb');
const database = require('../config/database');

class TimeSession {
    static getCollection() {
        return database.getDb().collection('time_sessions');
    }

    static async findActiveByTaskId(taskId) {
        return await this.getCollection().findOne({ 
            task_id: taskId, 
            end_time: null 
        });
    }

    static async findByTaskId(taskId) {
        return await this.getCollection()
            .find({ task_id: taskId })
            .sort({ start_time: -1 })
            .toArray();
    }

    static async findByUserId(userId) {
        return await this.getCollection()
            .find({ user_id: userId })
            .sort({ start_time: -1 })
            .toArray();
    }

    static async create(sessionData) {
        const session = {
            ...sessionData,
            _id: new ObjectId(),
            created_at: new Date(),
            end_time: null
        };
        
        const result = await this.getCollection().insertOne(session);
        return { _id: result.insertedId, ...session };
    }

    static async endSession(sessionId) {
        const endTime = new Date();
        const result = await this.getCollection().updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { end_time: endTime } }
        );
        
        if (result.modifiedCount > 0) {
            // Calculate duration and update task total time
            const session = await this.getCollection().findOne({ _id: new ObjectId(sessionId) });
            if (session && session.start_time) {
                const duration = Math.floor((endTime - session.start_time) / 1000); // in seconds
                await this.updateTaskTime(session.task_id, duration);
            }
        }
        
        return result.modifiedCount > 0;
    }

    static async endAllActiveByUserId(userId) {
        const activeSessions = await this.getCollection()
            .find({ user_id: userId, end_time: null })
            .toArray();
        
        for (const session of activeSessions) {
            await this.endSession(session._id);
        }
        
        return activeSessions.length;
    }

    static async updateTaskTime(taskId, additionalSeconds) {
        const Task = require('./Task'); // Avoid circular dependency
        return await Task.addTime(taskId, additionalSeconds);
    }

    static async getSessionsByUserId(userId, startDate, endDate) {
        const query = { user_id: userId };
        
        if (startDate || endDate) {
            query.start_time = {};
            if (startDate) query.start_time.$gte = startDate;
            if (endDate) query.start_time.$lte = endDate;
        }
        
        return await this.getCollection()
            .find(query)
            .sort({ start_time: -1 })
            .toArray();
    }
}

module.exports = TimeSession;
