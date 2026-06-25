const Category = require('../models/Category');


const getAllCategories = async (req, res) => {
  try {
    const data = await Category.findAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: "Tên danh mục không được trống!" });
    }

    const newCategory = await Category.create({ 
      name, 
      description, 
      parent_id: parent_id ? Number(parent_id) : null 
    });

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