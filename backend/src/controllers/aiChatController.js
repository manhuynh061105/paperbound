const AIChat = require('../models/AIChat');
const { generateAIResponse } = require('../services/aiService'); // Import service vừa viết ở trên

console.log("🤗 Kiểm tra Open-Source Token ở Backend:", process.env.HF_TOKEN ? "Đã nạp thành công!" : "Trống rỗng (Lỗi .env)!");

const sendMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: "Tin nhắn không được để trống." });
    }

    // 1. Lưu tin nhắn người dùng gửi vào Database
    await AIChat.saveMessage(userId, message, false);

    // 2. Gọi Service để lấy câu trả lời từ Gemini AI
    const botReply = await generateAIResponse(message);
    
    // 3. Lưu câu trả lời của AI vào Database
    const savedReply = await AIChat.saveMessage(userId, botReply, true);

    // 4. Trả dữ liệu về Frontend (Khớp hoàn toàn cấu trúc res.data.data.message_content của React)
    res.status(200).json({ success: true, data: savedReply });
  } catch (error) {
    console.error("❌ Lỗi xử lý AI Chatbot tại Controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await AIChat.getHistoryByUserId(req.params.userId);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getHistory };