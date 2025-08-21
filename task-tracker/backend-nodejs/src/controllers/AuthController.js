const AuthService = require('../services/AuthService');

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await AuthService.login(email, password);
            
            res.json({
                message: 'Login successful',
                user: user
            });
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async register(req, res) {
        try {
            const user = await AuthService.register(req.body);
            
            res.status(201).json({
                message: 'Registration successful',
                user: user
            });
        } catch (error) {
            res.status(400).json({
                detail: error.message
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await AuthService.getUserById(req.user.id);
            res.json(user);
        } catch (error) {
            res.status(404).json({
                detail: error.message
            });
        }
    }
}

module.exports = AuthController;
