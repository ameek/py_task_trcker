const { ObjectId } = require('mongodb');
const database = require('../config/database');

class User {
    static getCollection() {
        return database.getDb().collection('users');
    }

    static async findByEmail(email) {
        return await this.getCollection().findOne({ email });
    }

    static async findById(id) {
        return await this.getCollection().findOne({ _id: new ObjectId(id) });
    }

    static async create(userData) {
        const user = {
            ...userData,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const result = await this.getCollection().insertOne(user);
        return { _id: result.insertedId, ...user };
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
}

module.exports = User;
