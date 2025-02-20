// routes/isAdminMiddleware.js
const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key'); // Verify the token

        // Check if the decoded token has isAdmin as true
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Forbidden. Admins only.' });
        }

        // If user is admin, attach the decoded user data to the request
        req.user = decoded;
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(403).json({ message: 'Forbidden. Invalid token.' });
    }
};

module.exports = isAdmin;
