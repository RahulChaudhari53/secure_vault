const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate: Check if user is logged in
exports.protect = async (req, res, next) => {
    let token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Access Denied: No Session Found" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        
        const user = await User.findById(decoded.id).select('-password');

        // REVOCATION CHECK: If versions don't match, the token was revoked
        if (!user || (decoded.version !== undefined && decoded.version !== user.tokenVersion)) {
             return res.status(401).json({ message: "Session Revoked. Please login again." });
        }

        if (!user) {
             return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        res.status(401).json({ message: "Session Expired or Invalid" });
    }
};

// Authorize: Check if user has the right Role (RBAC)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Forbidden: ${req.user.role} role unauthorized` });
        }
        next();
    };
};