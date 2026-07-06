const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_extracker_123';
  const token = jwt.sign({ userId }, secret, {
    expiresIn: '30d'
  });

  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

module.exports = generateToken;
