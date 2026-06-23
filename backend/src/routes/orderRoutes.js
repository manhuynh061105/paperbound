const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 💡 Chạy trực tiếp qua đối tượng orderController gom gọn
router.post('/checkout', orderController.checkout); 
router.get('/user/:userId', orderController.getOrdersByUserId);
router.put('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;