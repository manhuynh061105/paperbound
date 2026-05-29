const pool = require('../config/db'); // Đã sửa lại đường dẫn chuẩn

const Category = {
  // 1. Lấy toàn bộ danh sách danh mục sách (giữ nguyên câu lệnh của hai bạn)
  findAll: async () => {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return result.rows;
  },

  // 2. Tạo một danh mục sách mới tinh (ĐÃ CẬP NHẬT ĐỂ LƯU DANH MỤC CON)
  create: async (categoryData) => {
    // 💡 BỔ SUNG: Lấy thêm parent_id từ dữ liệu dữ liệu đầu vào
    const { name, description, parent_id } = categoryData;
    
    // Cập nhật câu lệnh SQL để chèn thêm giá trị vào cột parent_id ($3)
    const query = `
      INSERT INTO categories (name, description, parent_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    // Truyền parent_id vào mảng tham số. 
    // Nếu parent_id là null hoặc undefined, Postgres sẽ tự động ghi nhận là NULL (Danh mục chính)
    const result = await pool.query(query, [
      name, 
      description || '', 
      parent_id !== undefined ? parent_id : null
    ]);
    
    return result.rows[0];
  }
};

module.exports = Category;