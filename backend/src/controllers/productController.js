const Product = require('../models/Product');
const pool = require('../config/db');

// 1. LẤY TOÀN BỘ DANH SÁCH SẢN PHẨM (ĐÃ BAO GỒM ĐA DANH MỤC)
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    const relationsResult = await pool.query('SELECT product_id, category_id FROM product_categories');
    const relations = relationsResult.rows || relationsResult;

    const data = products.map(product => {
      const productObj = product.toJSON ? product.toJSON() : { ...product };
      const matchedCategories = relations
        .filter(rel => rel.product_id.toString() === productObj.id.toString())
        .map(rel => rel.category_id);

      return {
        ...productObj,
        category_ids: matchedCategories
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
    const { 
      title, 
      price, 
      tax_rate, 
      stock_quantity, 
      category_ids, 
      cover_image,
      author,
      description,
      rating
    } = req.body;

    if (!title || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: "Tựa đề và giá sách không được để trống!" });
    }

    if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Sản phẩm phải thuộc ít nhất một danh mục hợp lệ!" });
    }

    const newProduct = await Product.create({
      title,
      price,
      tax_rate,
      stock_quantity,
      category_ids, 
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

// 4. LẤY SẢN PHẨM LIÊN QUAN
const getRelatedProducts = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Product.getRelated(id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("🔥 Lỗi tại getRelatedProducts Controller:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 5. CẬP NHẬT SẢN PHẨM (ADMIN) - ĐÃ ĐỒNG BỘ THAM SỐ SQL & BẢNG TRUNG GIAN
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, author, price, description, stock_quantity, cover_image, category_id, category_ids } = req.body;

  try {
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
    }

    // Câu lệnh SQL chỉ chứa 7 tham số ($1 -> $7) tương ứng với các cột có thật trong bảng products
    const sql = `
      UPDATE products 
      SET title = $1, author = $2, price = $3, description = $4, 
          stock_quantity = $5, cover_image = $6
      WHERE id = $7
      RETURNING *
    `;
    
    // Đã loại bỏ phần tử thừa, mảng values bây giờ có đúng 7 phần tử khớp hoàn toàn với câu lệnh SQL
    const values = [title, author, price, description, stock_quantity, cover_image, productId];
    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm để cập nhật." });
    }

    // --- XỬ LÝ ĐỒNG BỘ DANH MỤC SẢN PHẨM SANG BẢNG TRUNG GIAN ---
    // Hỗ trợ cả trường hợp FE truyền mảng category_ids hoặc chỉ truyền một số category_id lẻ
    const finalCategoryIds = category_ids || (category_id ? [category_id] : []);
    
    if (finalCategoryIds.length > 0) {
      // BƯỚC A: Xóa toàn bộ liên kết thể loại cũ của cuốn sách này
      await pool.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);
      
      // BƯỚC B: Chèn lại danh sách thể loại mới vào bảng trung gian
      for (const catId of finalCategoryIds) {
        if (catId) {
          await pool.query(
            'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [productId, catId]
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin sản phẩm và thể loại thành công!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Lỗi chi tiết tại updateProduct:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật sản phẩm." });
  }
};

// 6. XÓA SẢN PHẨM (ADMIN)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
    }

    // Trước khi xóa sản phẩm, cần xóa liên kết của nó trong bảng trung gian để tránh dính khóa ngoại
    await pool.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);

    const sql = `DELETE FROM products WHERE id = $1 RETURNING id`;
    const result = await pool.query(sql, [productId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa trước đó." });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công!"
    });
  } catch (error) {
    console.error("❌ Lỗi deleteProduct:", error.message);
    if (error.code === '23503') {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể xóa sản phẩm này vì đã có dữ liệu đánh giá hoặc đơn hàng liên quan!" 
      });
    }
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa sản phẩm." });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // 1. Tính tổng doanh thu: 
    // Mẹo: Đổi thành ILIKE hoặc thêm các trạng thái thực tế trong DB của bạn (ví dụ: 'Đã thanh toán', 'Thành công', 'completed')
    const totalRevenueQuery = `
      SELECT SUM(total_amount) as total 
      FROM orders 
      WHERE status IN ('completed', 'delivered', 'Thành công', 'Đã thanh toán', 'Đã giao hàng')
         OR status ILIKE '%thành%' 
         OR status ILIKE '%thanh%'
    `;
    
    // 2. Tính tổng số lượng đầu sách
    const totalProductsQuery = `SELECT COUNT(*) as total FROM products`;
    
    // 3. Tính tổng số lượng đơn hàng (Đếm toàn bộ đơn hàng trong hệ thống)
    const totalOrdersQuery = `SELECT COUNT(*) as total FROM orders`;

    // 4. Lấy dữ liệu doanh thu theo tháng cho biểu đồ
    const revenueChartQuery = `
      SELECT 
        TO_CHAR(created_at, 'MM/YYYY') as month_year,
        SUM(total_amount) as monthly_revenue,
        COUNT(id) as order_count
      FROM orders
      WHERE status IN ('completed', 'delivered', 'Thành công', 'Đã thanh toán', 'Đã giao hàng')
         OR status ILIKE '%thành%' 
         OR status ILIKE '%thanh%'
         AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    // Thực thi song song
    const [revRes, prodRes, orderRes, chartRes] = await Promise.all([
      pool.query(totalRevenueQuery),
      pool.query(totalProductsQuery),
      pool.query(totalOrdersQuery),
      pool.query(revenueChartQuery)
    ]);

    // Trả dữ liệu về cho Frontend
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: Number(revRes.rows[0]?.total || 0),
          totalProducts: Number(prodRes.rows[0]?.total || 0),
          totalOrders: Number(orderRes.rows[0]?.total || 0)
        },
        chartData: chartRes.rows || []
      }
    });
  } catch (error) {
    console.error("❌ Lỗi chi tiết tại getDashboardStats Backend:", error.message);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải thống kê." });
  }
};


// 💥 ĐỒNG BỘ EXPORT: Xuất tất cả các hàm thông qua object duy nhất
module.exports = { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  getRelatedProducts, 
  updateProduct, 
  deleteProduct,
  getDashboardStats 
};