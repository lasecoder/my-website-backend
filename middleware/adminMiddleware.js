const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Decode the token using your secret key
        const decoded = jwt.verify(token, 'your-secret-key');
        
        // Check if the decoded token has isAdmin set to true
        if (!decoded.isAdmin) {
            throw new Error('Access denied. Admins only.');
        }

        req.user = decoded; // Attach the decoded user data to the request object
        next(); // Allow the request to proceed
    } catch (err) {
        // Send a response for any errors (invalid token or not an admin)
        res.status(403).json({ message: 'Forbidden. Admins only.' });
    }
};

module.exports = isAdmin;
