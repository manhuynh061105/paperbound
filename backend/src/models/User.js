const pool = require('../config/db');

const User = {
  // Tạo người dùng mới
  create: async (userData) => {
    const { full_name, email, password, phone } = userData;
    const query = `
      INSERT INTO users (full_name, email, password, phone) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, full_name, email, role, created_at
    `;
    const result = await pool.query(query, [full_name, email, password, phone]);
    return result.rows[0];
  },

  // Tìm người dùng theo email (dùng khi đăng nhập)
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Tìm theo ID (dùng cho middleware hoặc trang cá nhân)
  findById: async (id) => {
    const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
};

module.exports = User;