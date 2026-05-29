const express = require('express');
const router = express.Router();
const { checkout } = require('../controllers/orderController');

// 💡 Trả lại sự nguyên bản, chạy trực tiếp hàm checkout không qua middleware trung gian nữa
router.post('/checkout', checkout);

module.exports = router;