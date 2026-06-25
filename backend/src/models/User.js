const pool = require('../config/db');

const User = {
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
      avatar || null 
    ]);
    return result.rows[0];
  },

  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  findById: async (id) => {
    const query = 'SELECT id, full_name, email, phone, role, avatar, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

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