const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Tuyến đường đọc dữ liệu (Khách và Admin đều xem được)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// THÊM DÒNG NÀY: Tuyến đường ghi dữ liệu (Dành riêng cho Admin thêm sản phẩm)
router.post('/', productController.createProduct);

module.exports = router;