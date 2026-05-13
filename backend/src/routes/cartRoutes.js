const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/:userId', cartController.getCart);
router.post('/add', cartController.addItem);
router.delete('/:userId/:productId', cartController.deleteItem);

module.exports = router;