const pool = require('../config/db');

const Cart = {
  findByUserId: async (userId) => {
    const query = `
      SELECT 
        c.id, 
        c.product_id, 
        c.quantity, 
        p.title, 
        p.price, 
        p.cover_image, 
        p.tax_rate,
        p.author,
        p.stock_quantity AS stock  -- 🌟 Đổi tên stock_quantity thành stock để khớp với Frontend
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  addToCart: async (userId, productId, quantity) => {
    const query = `
      INSERT INTO carts (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET quantity = carts.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [userId, productId, quantity]);
    return result.rows[0];
  },

  updateQuantity: async (userId, productId, quantity) => {
    const query = `
      UPDATE carts 
      SET quantity = $3 
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [userId, productId, quantity]);
    return result.rows[0];
  },

  removeItem: async (userId, productId) => {
    await pool.query('DELETE FROM carts WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  },

  clearCart: async (userId) => {
    await pool.query('DELETE FROM carts WHERE user_id = $1', [userId]);
  }
};

module.exports = Cart;