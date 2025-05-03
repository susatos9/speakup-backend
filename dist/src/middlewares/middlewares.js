"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bypassAuth = void 0;
const bypassAuth = (req, res, next) => {
    // Check if ValidateFirebaseToken is being attempted
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        res.status(403).json({ message: 'Authentication is currently disabled' });
        return;
    }
    // Otherwise, pass through
    next();
};
exports.bypassAuth = bypassAuth;
//# sourceMappingURL=middlewares.js.map