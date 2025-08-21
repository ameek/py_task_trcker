// Simple authentication middleware
// In a real application, you'd use JWT tokens or sessions

const authMiddleware = (req, res, next) => {
    // For this demo, we'll use a simple user_id in headers
    // In production, you'd verify JWT tokens or session cookies
    
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
        return res.status(401).json({
            detail: 'Authentication required. Please provide x-user-id header.'
        });
    }
    
    // Set user in request object
    req.user = { id: userId };
    next();
};

module.exports = authMiddleware;
