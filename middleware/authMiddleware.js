const User = require('../models/User');

const protect = async (req, res, next) => {
  const userId = req.headers['user-id'];

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
