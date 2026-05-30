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

// 2. Hàm xử lý thêm danh mục mới từ Admin Panel (ĐÃ SỬA ĐỂ HỖ TRỢ DANH MỤC CON)
const createCategory = async (req, res) => {
  try {
    // 💡 BỔ SUNG: Hứng thêm trường parent_id từ Frontend gửi lên
    const { name, description, parent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: "Tên danh mục không được trống!" });
    }

    // 💡 CẢI TIẾN: Truyền parent_id vào Sequelize để tạo danh mục con
    // Nếu parent_id là undefined hoặc null, Sequelize sẽ tự hiểu và lưu NULL vào Postgres (Danh mục chính)
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