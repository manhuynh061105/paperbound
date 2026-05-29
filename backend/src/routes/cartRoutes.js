const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/:userId', cartController.getCart);
router.post('/add', cartController.addItem);
router.delete('/:userId/:productId', cartController.deleteItem);

// Kiểm tra dòng số 8 này xem có viết đúng chính tả tên hàm không:
router.put('/update', cartController.updateQuantity); 

module.exports = router;