const pool = require('../config/db');

const Product = {
  // 1. Lấy toàn bộ danh sách sách (Sắp xếp theo ID mới nhất)
  findAll: async () => {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    return result.rows;
  },

  // 2. Tìm chi tiết một cuốn sách theo ID (Phục vụ trang chi tiết sản phẩm)
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  },

  // 3. CẬP NHẬT: Thêm sách mới đầy đủ các trường Tác giả, Mô tả, Đánh giá
  create: async (productData) => {
    const { 
      title, 
      price, 
      tax_rate, 
      stock_quantity, 
      category_id, 
      cover_image,
      author,       // <--- Nhận thêm trường tác giả
      description,  // <--- Nhận thêm trường mô tả / trích đoạn sách
      rating        // <--- Nhận thêm trường điểm đánh giá
    } = productData;

    const query = `
      INSERT INTO products (title, price, tax_rate, stock_quantity, category_id, cover_image, author, description, rating)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      title, 
      price, 
      tax_rate || 0.00,       // Mặc định thuế 0% theo form modal
      stock_quantity || 0,    // Mặc định số lượng nhập kho là 0 nếu để trống
      category_id, 
      cover_image || null,
      author || 'Chưa rõ',    // Mặc định nếu không điền tác giả sẽ lưu 'Chưa rõ'
      description || '',      // Mặc định chuỗi rỗng nếu sách không có mô tả
      rating || 5.00          // Mặc định đánh giá 5 sao chuẩn mực
    ]);

    return result.rows[0];
  }
};

module.exports = Product;