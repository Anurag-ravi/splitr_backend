const { verifyToken } = require("../utilities/token");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        res.json({ status: 401, message: 'Unauthorized' });
    }
    verifyToken(token).then((result) => {
        if (result.status) {
            req.user = result.user;
            next();
        } else {
            res.json({ status: 401, message: 'Unauthorized' });
        }
    });
};

module.exports = {authMiddleware};