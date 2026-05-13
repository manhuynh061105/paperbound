const pool = require('../config/db');

const Product = {
  findAll: async () => {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    return result.rows;
  },
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  }
};

module.exports = Product;