const pool = require('../config/db');

const AIChat = {
  saveMessage: async (userId, content, isFromAi) => {
    const query = `
      INSERT INTO ai_chat_histories (user_id, message_content, is_from_ai)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId || null, content, isFromAi]);
    return result.rows[0];
  },

  getHistoryByUserId: async (userId) => {
    if (!userId) return [];
    
    const query = `
      SELECT * FROM ai_chat_histories 
      WHERE user_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
};

module.exports = AIChat;