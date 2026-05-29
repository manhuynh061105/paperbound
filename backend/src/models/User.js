const pool = require('../config/db');

const User = {
  // 1. Tạo người dùng mới (Mặc định role trong DB sẽ tự lấy 'customer' nếu cấu hình DEFAULT)
  create: async (userData) => {
    const { full_name, email, password, phone, avatar } = userData;
    const query = `
      INSERT INTO users (full_name, email, password, phone, avatar) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, full_name, email, phone, role, avatar, created_at
    `;
    const result = await pool.query(query, [
      full_name, 
      email, 
      password, 
      phone || null, 
      avatar || null // Mặc định chưa đăng ký ảnh sẽ là null
    ]);
    return result.rows[0];
  },

  // 2. Tìm người dùng theo email (Trả về kèm password để so sánh lúc Đăng nhập)
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // 3. Tìm theo ID (Lấy đầy đủ thông tin trừ password để trả về trang Profile cá nhân)
  findById: async (id) => {
    const query = 'SELECT id, full_name, email, phone, role, avatar, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // 4. BỔ SUNG: Hàm cập nhật thông tin cá nhân & Ảnh đại diện (Dùng cho trang Profile)
  updateProfile: async (id, updateData) => {
    const { full_name, phone, avatar } = updateData;
    const query = `
      UPDATE users 
      SET full_name = $1, phone = $2, avatar = $3
      WHERE id = $4
      RETURNING id, full_name, email, phone, role, avatar, created_at
    `;
    const result = await pool.query(query, [full_name, phone, avatar, id]);
    return result.rows[0];
  }
};

module.exports = User;