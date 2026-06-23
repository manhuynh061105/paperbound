const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');

// Đường dẫn xử lý khi gửi tin nhắn mới (Frontend gọi: POST -> /api/ai/send)
router.post('/send', aiChatController.sendMessage);

// Đường dẫn lấy lịch sử chat cũ theo id người dùng (Frontend gọi: GET -> /api/ai/history/:userId)
router.get('/history/:userId', aiChatController.getHistory);

module.exports = router;