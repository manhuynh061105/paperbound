const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const upload = require('../middleware/uploadMiddleware'); // 👈 Import middleware vừa tạo

// Thêm upload.any() vào đây để bóc tách FormData đi vào req.body
router.post('/', upload.any(), reviewController.createReview);
router.get('/:id/reviews', reviewController.getReviewsByProductId);
module.exports = router;