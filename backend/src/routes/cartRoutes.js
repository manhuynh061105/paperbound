const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const verifyToken = require('../middleware/authMiddleware'); 

router.get('/:userId', verifyToken, cartController.getCart);
router.post('/add', verifyToken, cartController.addItem);
router.delete('/:userId/:productId', verifyToken, cartController.deleteItem);
router.put('/update', verifyToken, cartController.updateQuantity); 

module.exports = router;