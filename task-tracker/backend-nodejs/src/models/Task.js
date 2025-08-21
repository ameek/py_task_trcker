const { ObjectId } = require('mongodb');
const database = require('../config/database');

class Task {
    static getCollection() {
        return database.getDb().collection('tasks');
    }

    static async findByUserId(userId, filters = {}) {
        const query = { user_id: userId };
        
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.category) {
            query.category = filters.category;
        }
        if (filters.priority) {
            query.priority = filters.priority;
        }
        
        return await this.getCollection()
            .find(query)
            .sort({ created_at: -1 })
            .toArray();
    }

    static async findById(id) {
        console.log('Task.findById called with:', { id, idType: typeof id, idLength: id?.length });
        try {
            const objectId = new ObjectId(id);
            console.log('Converted to ObjectId:', objectId);
            const result = await this.getCollection().findOne({ _id: objectId });
            console.log('Query result:', result ? 'Found' : 'Not found');
            return result;
        } catch (error) {
            console.error('Error in findById:', error.message);
            return null;
        }
    }

    static async findActiveByUserId(userId) {
        return await this.getCollection().findOne({ 
            user_id: userId, 
            status: 'in_progress' 
        });
    }

    static async create(taskData) {
        const task = {
            ...taskData,
            _id: new ObjectId(),
            created_at: new Date(),
            updated_at: new Date(),
            total_time: 0,
            tags: taskData.tags || [],
            notes: taskData.notes || '',
            category: taskData.category || null
        };
        
        const result = await this.getCollection().insertOne(task);
        return { _id: result.insertedId, ...task };
    }

    static async update(id, updates) {
        const updateData = {
            ...updates,
            updated_at: new Date()
        };
        
        const result = await this.getCollection().updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        return result.modifiedCount > 0;
    }

    static async delete(id) {
        const result = await this.getCollection().deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    static async updateStatus(id, status) {
        return await this.update(id, { status });
    }

    static async addTime(id, timeInSeconds) {
        const result = await this.getCollection().updateOne(
            { _id: new ObjectId(id) },
            { 
                $inc: { total_time: timeInSeconds },
                $set: { updated_at: new Date() }
            }
        );
        
        return result.modifiedCount > 0;
    }

    static async pauseAllForUser(userId) {
        const result = await this.getCollection().updateMany(
            { user_id: userId, status: 'in_progress' },
            { 
                $set: { 
                    status: 'paused',
                    updated_at: new Date()
                }
            }
        );
        
        return result.modifiedCount;
    }

    // Aggregation queries for reports
    static async getCompletionStats(userId) {
        const pipeline = [
            { $match: { user_id: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total_time: { $sum: '$total_time' }
                }
            }
        ];
        
        return await this.getCollection().aggregate(pipeline).toArray();
    }

    static async getDailyReport(userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        return await this.getCollection()
            .find({
                user_id: userId,
                status: 'completed',
                updated_at: { $gte: startOfDay, $lte: endOfDay }
            })
            .toArray();
    }

    static async getWeeklyReport(userId, startDate, endDate) {
        return await this.getCollection()
            .find({
                user_id: userId,
                status: 'completed',
                updated_at: { $gte: startDate, $lte: endDate }
            })
            .toArray();
    }
}

module.exports = Task;
