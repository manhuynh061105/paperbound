const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 1. Tuyến đường lấy toàn bộ danh sách sách (GET /api/products)
router.get('/', productController.getAllProducts);

// 2. 💡 BỔ SUNG: Tuyến đường lấy sách cùng thể loại (GET /api/products/:id/related)
// Phải có route này thì trang chi tiết ở Frontend mới lấy được danh sách gợi ý và không bị lỗi 404!
router.get('/:id/related', productController.getRelatedProducts);

// 3. Tuyến đường lấy chi tiết một cuốn sách theo ID (GET /api/products/:id)
router.get('/:id', productController.getProductById);

// 4. Tuyến đường ghi dữ liệu - Dành riêng cho Admin thêm sản phẩm (POST /api/products)
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;