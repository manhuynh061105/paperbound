const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware'); // 🔑 Import middleware

router.post('/register', userController.register);
router.post('/login', userController.login);

// Bảo vệ 2 đường dẫn profile cá nhân
router.get('/profile/:id', verifyToken, userController.getProfile);
router.put('/profile/:id', verifyToken, userController.updateProfile);

module.exports = router;