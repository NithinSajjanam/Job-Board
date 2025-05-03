import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header missing' });
        }
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Invalid authorization format' });
        }
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

export default auth;
