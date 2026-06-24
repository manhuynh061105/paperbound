const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware'); // 🔑 Import middleware

// Khách hàng phải đăng nhập mới được Checkout và xem lịch sử đơn của mình
router.post('/checkout', verifyToken, orderController.checkout); 
router.get('/user/:userId', verifyToken, orderController.getOrdersByUserId);

// Route thay đổi trạng thái đơn hàng (Thường dành cho Admin hoặc nội bộ hệ thống)
router.put('/:orderId/status', verifyToken, orderController.updateOrderStatus);

module.exports = router;