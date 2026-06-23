const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { getDashboardStats } = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id', productController.getProductById);

router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;