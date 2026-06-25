const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

const verifyToken = require('../middleware/authMiddleware'); 

console.log("=== Kiểm tra Middleware verifyToken ===", typeof verifyToken); 

router.post('/checkout', verifyToken, orderController.checkout); 
router.get('/user/:userId', verifyToken, orderController.getOrdersByUserId);
router.put('/:orderId/status', verifyToken, orderController.updateOrderStatus);

module.exports = router;