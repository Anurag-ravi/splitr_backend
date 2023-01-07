import { verifyToken } from '../utilities/token';
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if (!token) {
        res.json({ status: 401, message: 'Unauthorized' });
    } else {
        verifyToken(token).then((result) => {
            if (result.status) {
                req.user = result.user;
                next();
            } else {
                res.json({ status: 401, message: 'Unauthorized' });
            }
        });
    }
};
