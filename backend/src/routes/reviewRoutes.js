const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const upload = require('../middleware/uploadMiddleware'); 
const verifyToken = require('../middleware/authMiddleware'); // 🔑 Import middleware

// Ép buộc kiểm tra token trước khi cho phép xử lý upload ảnh và lưu review
router.post('/', verifyToken, upload.any(), reviewController.createReview);

// Xem đánh giá của một sản phẩm thì ai cũng xem được (Public) -> Không cần chèn verifyToken
router.get('/:id/reviews', reviewController.getReviewsByProductId);

module.exports = router;