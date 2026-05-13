const pool = require('../config/db');

const User = {
  create: async (userData) => {
    const { full_name, email, password, phone } = userData;
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [full_name, email, password, phone]
    );
    return result.rows[0];
  },
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }
};

module.exports = User;