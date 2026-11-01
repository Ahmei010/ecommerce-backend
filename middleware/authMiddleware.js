import jwt from 'jsonwebtoken';
import User from '../models/User.js';

async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  const token = req.cookies?.token || (
    authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  );

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to continue.',
    });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET is not configured.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = typeof decoded === 'string' ? null : decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account for this token no longer exists.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session is invalid or has expired. Please log in again.',
      });
    }

    return next(error);
  }
}

export default authMiddleware;
