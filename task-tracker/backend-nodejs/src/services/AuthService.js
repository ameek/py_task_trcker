const User = require('../models/User');

class AuthService {
    static async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // In a real app, you'd hash and compare passwords
        // For this demo, we're using plain text (not recommended for production)
        if (user.password !== password) {
            throw new Error('Invalid credentials');
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async register(userData) {
        const { full_name, email, password } = userData;

        if (!full_name || !email || !password) {
            throw new Error('Full name, email, and password are required');
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Validate password length
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Create user
        const newUser = await User.create({
            full_name: full_name.trim(),
            email: email.toLowerCase().trim(),
            password // In production, hash this password
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    static async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

module.exports = AuthService;
