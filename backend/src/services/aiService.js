const { InferenceClient } = require("@huggingface/inference");
const Product = require('../models/Product');
const pool = require('../config/db');

const hf = new InferenceClient(process.env.HF_TOKEN);

const generateAIResponse = async (userMessage) => {
  try {
    const products = await Product.findAll();
    const relationsResult = await pool.query('SELECT product_id, category_id FROM product_categories');
    const relations = relationsResult.rows || relationsResult;

    const booksContext = products.map((product, index) => {
      const productObj = product.toJSON ? product.toJSON() : { ...product };
      const matchedCategories = relations
        .filter(rel => rel.product_id.toString() === productObj.id.toString())
        .map(rel => rel.category_id);

      return `${index + 1}. [ID: ${productObj.id}] - Tên sách: "${productObj.title}" - Tác giả: ${productObj.author || 'Chưa rõ'} - Giá: ${Number(productObj.price).toLocaleString()}đ - Mã danh mục: ${matchedCategories.join(', ') || 'Chưa phân loại'} - Mô tả: ${productObj.description || 'Đang cập nhật'}`;
    }).join("\n\n");

    const systemInstruction = `
      Bạn là "Paperbound AI" - trợ lý ảo thông minh tại nhà sách Paperbound.
      
      Dưới đây là DANH SÁCH TOÀN BỘ CÁC CUỐN SÁCH HIỆN CÓ THỰC TẾ trong kho hàng của website:
      ---
      ${booksContext}
      ---

      QUY TẮC PHẢN HỒI BẮT BUỘC:
      1. Luôn phản hồi bằng Tiếng Việt một cách thân thiện, lịch sự và chu đáo.
      2. BẠN CHỈ ĐƯỢC PHÉP gợi ý hoặc tư vấn các cuốn sách có mặt trong danh sách phía trên. Tuyệt đối không tự bịa ra sách hoặc giới thiệu sách nằm ngoài hệ thống Paperbound.
      3. Nếu người dùng tìm sách không có, hãy lịch sự thông báo: "Dạ hiện tại Paperbound chưa cập nhật cuốn sách này, nhưng bạn có thể tham khảo các đầu sách cùng thể loại rất hay hiện có..." và chủ động gợi ý sách có trong danh sách trên.
    `;

    const out = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1000,
    });

    return out.choices[0].message.content; 
  } catch (error) {
    console.error("❌ Lỗi tại Open-Source aiService:", error);
    throw new Error("Không thể kết nối với trí tuệ nhân tạo Paperbound Open-Source.");
  }
};

module.exports = { generateAIResponse };