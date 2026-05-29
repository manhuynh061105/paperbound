const Product = require('../models/Product');

// 1. LẤY TOÀN BỘ DANH SÁCH SẢN PHẨM
const getAllProducts = async (req, res) => {
  try {
    const data = await Product.findAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. LẤY CHI TIẾT MỘT CUỐN SÁCH THEO ID
const getProductById = async (req, res) => {
  try {
    const data = await Product.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuốn sách này!" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. BỔ SUNG: HÀM TIẾP NHẬN YÊU CẦU THÊM SÁCH MỚI TỪ ADMIN
const createProduct = async (req, res) => {
  try {
    // Đón nhận toàn bộ dữ liệu, bao gồm cả các trường nâng cấp từ Frontend gửi lên
    const { 
      title, 
      price, 
      tax_rate, 
      stock_quantity, 
      category_id, 
      cover_image,
      author,
      description,
      rating
    } = req.body;

    // Kiểm tra nhanh điều kiện bắt buộc cơ bản
    if (!title || !price) {
      return res.status(400).json({ success: false, message: "Tựa đề và giá sách không được để trống!" });
    }

    // Gọi hàm create trong model Product để lưu thông tin xuống Postgres
    const newProduct = await Product.create({
      title,
      price,
      tax_rate,
      stock_quantity,
      category_id,
      cover_image,
      author,
      description,
      rating
    });

    // Trả về phản hồi thành công kèm dữ liệu cuốn sách vừa tạo
    res.status(201).json({ 
      success: true, 
      message: "Thêm sách mới vào hệ thống thành open thành công!", 
      data: newProduct 
    });

  } catch (err) {
    console.error("Lỗi tại createProduct Controller:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// EXPORT ĐẦY ĐỦ CẢ 3 BIẾN ĐỂ ROUTE SỬ DỤNG
module.exports = { getAllProducts, getProductById, createProduct };