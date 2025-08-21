const { ObjectId } = require('mongodb');
const database = require('../config/database');

class Category {
    static getCollection() {
        return database.getDb().collection('categories');
    }

    static async findByUserId(userId) {
        return await this.getCollection()
            .find({ user_id: userId })
            .sort({ name: 1 })
            .toArray();
    }

    static async findById(id) {
        return await this.getCollection().findOne({ _id: new ObjectId(id) });
    }

    static async create(categoryData) {
        const category = {
            ...categoryData,
            _id: new ObjectId(),
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const result = await this.getCollection().insertOne(category);
        return { _id: result.insertedId, ...category };
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

    static async getCategoryStats(userId) {
        const pipeline = [
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'tasks'
                }
            },
            {
                $match: { user_id: userId }
            },
            {
                $project: {
                    name: 1,
                    color: 1,
                    task_count: { $size: '$tasks' },
                    total_time: { $sum: '$tasks.total_time' }
                }
            }
        ];
        
        return await this.getCollection().aggregate(pipeline).toArray();
    }
}

module.exports = Category;
