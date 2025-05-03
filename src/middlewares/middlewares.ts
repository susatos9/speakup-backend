import { Request, Response, NextFunction } from 'express';

export const bypassAuth = (req: Request, res: Response, next: NextFunction): void => {
    // Check if ValidateFirebaseToken is being attempted
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        res.status(403).json({ message: 'Authentication is currently disabled' });
        return;
    }
    // Otherwise, pass through
    next();
};
