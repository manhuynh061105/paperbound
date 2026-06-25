const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');

router.post('/send', aiChatController.sendMessage);

router.get('/history/:userId', aiChatController.getHistory);

module.exports = router;