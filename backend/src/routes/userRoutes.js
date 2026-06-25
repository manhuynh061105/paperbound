const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware'); 

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/profile/:id', verifyToken, userController.getProfile);
router.put('/profile/:id', verifyToken, userController.updateProfile);

module.exports = router;