const pool = require('../config/db');

const AIChat = {
  // Lưu tin nhắn mới (Cả của User và của AI) vào cơ sở dữ liệu
  saveMessage: async (userId, content, isFromAi) => {
    // Sử dụng COALESCE hoặc cho phép truyền null đối với userId (nếu khách chưa đăng nhập)
    const query = `
      INSERT INTO ai_chat_histories (user_id, message_content, is_from_ai)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId || null, content, isFromAi]);
    return result.rows[0];
  },

  // Lấy toàn bộ lịch sử chat sắp xếp theo thời gian tăng dần để hiển thị lên giao diện
  getHistoryByUserId: async (userId) => {
    // Nếu userId không tồn tại (khách vãng lai), trả về mảng rỗng thay vì báo lỗi
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