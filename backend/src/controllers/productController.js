const Product = require('../models/Product');
const pool = require('../config/db');

// 1. LẤY TOÀN BỘ DANH SÁCH SẢN PHẨM (ĐÃ BAO GỒM ĐA DANH MỤC)
const getAllProducts = async (req, res) => {
  try {
    // Lấy danh sách sản phẩm gốc từ Model
    const products = await Product.findAll();
    
    // Truy vấn tất cả các mối quan hệ trong bảng trung gian product_categories
    // Bảng trung gian của bạn chứa: product_id và category_id
    const relationsResult = await pool.query('SELECT product_id, category_id FROM product_categories');
    const relations = relationsResult.rows || relationsResult; // Tùy thuộc vào thư viện pg trả về rows trực tiếp hay qua mảng

    // Gộp mảng category_ids vào từng object sản phẩm tương ứng
    const data = products.map(product => {
      // Ép kiểu sản phẩm về object thuần nếu là Sequelize Instance
      const productObj = product.toJSON ? product.toJSON() : { ...product };
      
      // Lọc ra các category_id thuộc về product_id này
      const matchedCategories = relations
        .filter(rel => rel.product_id.toString() === productObj.id.toString())
        .map(rel => rel.category_id);

      return {
        ...productObj,
        category_ids: matchedCategories // <--- Đính kèm mảng ID vào đây cho Frontend dùng
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("Lỗi tại getAllProducts Controller:", err.message);
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

// 3. TIẾP NHẬN YÊU CẦU THÊM SÁCH MỚI TỪ ADMIN (HỖ TRỢ MẢNG DANH MỤC)
const createProduct = async (req, res) => {
  try {
    // Đón nhận dữ liệu, chuyển từ trường đơn category_id sang mảng category_ids
    const { 
      title, 
      price, 
      tax_rate, 
      stock_quantity, 
      category_ids, // <--- Nhận mảng ID danh mục từ Modal mới gửi lên
      cover_image,
      author,
      description,
      rating
    } = req.body;

    // Kiểm tra điều kiện bắt buộc cơ bản
    if (!title || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: "Tựa đề và giá sách không được để trống!" });
    }

    if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Sản phẩm phải thuộc ít nhất một danh mục hợp lệ!" });
    }

    // Gọi hàm tạo tích hợp đa danh mục từ Model xuống Postgres
    const newProduct = await Product.create({
      title,
      price,
      tax_rate,
      stock_quantity,
      category_ids, // <--- Truyền mảng đi xuống Model xử lý tiếp
      cover_image,
      author,
      description,
      rating
    });

    res.status(201).json({ 
      success: true, 
      message: "Thêm sách mới vào hệ thống thành công!", 
      data: newProduct 
    });

  } catch (err) {
    console.error("Lỗi tại createProduct Controller:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getRelatedProducts = async (req, res) => {
  const { id } = req.params;

  try {
    // 💡 Gọi hàm từ tầng Model đã khai báo ở trên
    const data = await Product.getRelated(id);

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("🔥 Lỗi tại getRelatedProducts Controller:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Nhớ thêm getRelatedProducts vào module.exports ở cuối file nhé!
module.exports = { getAllProducts, getProductById, createProduct, getRelatedProducts };