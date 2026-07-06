const express = require('express');
const router = express.Router();
const { loginUser, registerUser, logoutUser } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser); // Mainly to create the default user initially
router.post('/logout', logoutUser);

module.exports = router;
