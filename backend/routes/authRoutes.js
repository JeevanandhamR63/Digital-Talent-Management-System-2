const express = require('express');
const { registerUser, loginUser, getAllUsers, googleLogin } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/users', protect, admin, getAllUsers);

module.exports = router;
