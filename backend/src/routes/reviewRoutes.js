const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const upload = require('../middleware/uploadMiddleware'); 
const verifyToken = require('../middleware/authMiddleware'); 

router.post('/', verifyToken, upload.any(), reviewController.createReview);

router.get('/:id/reviews', reviewController.getReviewsByProductId);

module.exports = router;