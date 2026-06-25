const pool = require('../config/db');

const Category = {
  findAll: async () => {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return result.rows;
  },

  create: async (categoryData) => {
    const { name, description, parent_id } = categoryData;
    
    const query = `
      INSERT INTO categories (name, description, parent_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name, 
      description || '', 
      parent_id !== undefined ? parent_id : null
    ]);
    
    return result.rows[0];
  }
};

module.exports = Category;