const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 🌟 Hãy đảm bảo đường dẫn này khớp 100% với chữ hoa/thường của thư mục gốc:
const verifyToken = require('../middleware/authMiddleware'); 

// 💡 Thêm dòng này để kiểm tra xem khi khởi chạy nó có nhận diện được hàm không
console.log("=== Kiểm tra Middleware verifyToken ===", typeof verifyToken); 

// Khách hàng phải đăng nhập mới được Checkout và xem lịch sử đơn của mình
router.post('/checkout', verifyToken, orderController.checkout); 
router.get('/user/:userId', verifyToken, orderController.getOrdersByUserId);
router.put('/:orderId/status', verifyToken, orderController.updateOrderStatus);

module.exports = router;