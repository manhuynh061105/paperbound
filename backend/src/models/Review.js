const db = require('../config/db');

const Review = {
  create: async (reviewData) => {
    // 💡 Thêm biến review_image nhận từ controller
    const { user_id, product_id, rating, comment, review_image } = reviewData;
    
    const sql = `
      INSERT INTO reviews (user_id, product_id, rating, comment, review_image, created_at) 
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    
    // Truyền đủ 5 tham số vào mảng tương ứng
    const result = await db.query(sql, [user_id, product_id, rating, comment, review_image]);
    return result.rows[0];
  }
};

module.exports = Review;