import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true, // Always use secure in production
    sameSite: 'none', // Required for cross-origin
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
    domain: config.nodeEnv === 'production' ? '.onrender.com' : undefined,
  });
};

export default generateToken;