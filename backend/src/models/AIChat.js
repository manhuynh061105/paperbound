const pool = require('../config/db');

const AIChat = {
  // Lưu tin nhắn mới (cả của User và của AI)
  saveMessage: async (userId, content, isFromAi) => {
    const query = `
      INSERT INTO ai_chat_histories (user_id, message_content, is_from_ai)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, content, isFromAi]);
    return result.rows[0];
  },

  // Lấy lịch sử chat để hiển thị lên giao diện
  getHistoryByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM ai_chat_histories WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return result.rows;
  }
};

module.exports = AIChat;