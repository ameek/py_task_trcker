const { ObjectId } = require('mongodb');
const database = require('../config/database');

class TaskLink {
    static getCollection() {
        return database.getDb().collection('task_links');
    }

    static async findByTaskId(taskId) {
        return await this.getCollection()
            .find({ task_id: taskId })
            .sort({ created_at: -1 })
            .toArray();
    }

    static async findById(id) {
        return await this.getCollection().findOne({ _id: new ObjectId(id) });
    }

    static async create(linkData) {
        const link = {
            ...linkData,
            _id: new ObjectId(),
            created_at: new Date()
        };
        
        const result = await this.getCollection().insertOne(link);
        return { _id: result.insertedId, ...link };
    }

    static async delete(id) {
        const result = await this.getCollection().deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    static async deleteByTaskId(taskId) {
        const result = await this.getCollection().deleteMany({ task_id: taskId });
        return result.deletedCount;
    }
}

module.exports = TaskLink;
