const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Khách hoặc Admin gọi cái này để nạp danh mục
router.get('/', categoryController.getAllCategories);

// Admin gọi cái này để tạo danh mục sách mới
router.post('/', categoryController.createCategory);

module.exports = router;