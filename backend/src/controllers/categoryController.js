const Category = require('../models/Category');

// 1. Hàm trả về danh sách danh mục cho ô Select ở Modal sản phẩm
const getAllCategories = async (req, res) => {
  try {
    const data = await Category.findAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Hàm xử lý thêm danh mục mới từ Admin Panel
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: "Tên danh mục không được trống!" });
    }

    const newCategory = await Category.create({ name, description });
    res.status(201).json({ 
      success: true, 
      message: "Tạo danh mục mới thành công!", 
      data: newCategory 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllCategories, createCategory };