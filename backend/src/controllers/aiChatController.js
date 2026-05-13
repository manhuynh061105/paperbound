const AIChat = require('../models/AIChat');

const sendMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    // 1. Lưu tin nhắn của User vào DB
    await AIChat.saveMessage(userId, message, false);

    // 2. Mô phỏng câu trả lời của AI (Chưa gọi API xịn, chỉ để test luồng)
    const botReply = `Cảm ơn bạn đã hỏi về "${message}". Tôi là AI của Paperbound, tôi sẽ sớm được nâng cấp để tư vấn cho bạn!`;
    
    // 3. Lưu câu trả lời của AI vào DB
    const savedReply = await AIChat.saveMessage(userId, botReply, true);

    res.status(200).json({ success: true, data: savedReply });
  } catch (error) {
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