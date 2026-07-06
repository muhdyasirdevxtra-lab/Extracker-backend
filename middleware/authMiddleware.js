const User = require('../models/User');

const protect = async (req, res, next) => {
  let userId;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    userId = req.headers.authorization.split(' ')[1];
  }

  if (userId) {
    try {
      req.user = await User.findById(userId).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, invalid user ID' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no user ID provided' });
  }
};

module.exports = { protect };
