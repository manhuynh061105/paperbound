const AIChat = require('../models/AIChat');
const { generateAIResponse } = require('../services/aiService');

console.log("🤗 Kiểm tra Open-Source Token ở Backend:", process.env.HF_TOKEN ? "Đã nạp thành công!" : "Trống rỗng (Lỗi .env)!");

const sendMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: "Tin nhắn không được để trống." });
    }

    await AIChat.saveMessage(userId, message, false);

    const botReply = await generateAIResponse(message);
    
    const savedReply = await AIChat.saveMessage(userId, botReply, true);

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