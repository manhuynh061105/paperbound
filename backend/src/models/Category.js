const pool = require('../config/db'); // Đã sửa lại đường dẫn chuẩn

const Category = {
  // Lấy toàn bộ danh sách danh mục sách
  findAll: async () => {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return result.rows;
  },

  // Tạo một danh mục sách mới tinh
  create: async (categoryData) => {
    const { name, description } = categoryData;
    const query = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description || '']);
    return result.rows[0];
  }
};

module.exports = Category;