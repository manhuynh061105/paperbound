const Review = require('../models/Review');
const pool = require('../config/db');

exports.createReview = async (req, res) => {
  try {
    const { user_id, product_id, rating, comment } = req.body;

    if (!user_id || !product_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đánh giá bắt buộc."
      });
    }

    // 📸 XỬ LÝ ĐƯỜNG DẪN ẢNH TỪ MULTER
    let review_image = null;
    
    // Nếu bạn sử dụng upload.any() ở route:
    if (req.files && req.files.length > 0) {
      // Tìm đúng file có fieldname là 'reviewImage'
      const imageFile = req.files.find(f => f.fieldname === 'reviewImage');
      if (imageFile) {
        // Nếu bạn lưu dạng file vật lý trên server (Ví dụ dùng diskStorage):
        // review_image = `/uploads/reviews/${imageFile.filename}`;
        
        // Nếu bạn dùng memoryStorage (Dữ liệu dạng Buffer), bạn có thể chuyển thành chuỗi Base64 để lưu trực tiếp vào TEXT của PostgreSQL:
        review_image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
      }
    }

    // Gọi Model lưu vào PostgreSQL (Bao gồm cả ảnh)
    await Review.create({ 
      user_id: parseInt(user_id), 
      product_id: parseInt(product_id), 
      rating: parseInt(rating), 
      comment,
      review_image // 👈 Truyền đường dẫn/chuỗi ảnh vào model
    });

    return res.status(201).json({
      success: true,
      message: "⭐️ Gửi đánh giá sản phẩm kèm ảnh thành công!"
    });

  } catch (error) {
    console.error("Lỗi Controller Review:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + error.message
    });
  }
};

exports.getReviewsByProductId = async (req, res) => {
  const { id } = req.params; // Lấy product_id từ URL
  
  try {
    // Ép kiểu số nguyên an toàn để tránh lỗi kiểu dữ liệu PostgreSQL
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
    }

    // 💥 ĐÃ SỬA: Thay u.username thành u.full_name AS username để Front-End không bị lỗi giao diện
    const sql = `
      SELECT r.id, r.rating, r.comment, r.review_image, r.created_at, u.full_name AS username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await pool.query(sql, [productId]);
    
    console.log(`🔍 Đã tìm thấy ${result.rowCount} đánh giá cho sản phẩm ID: ${productId}`);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách review:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi tải đánh giá sản phẩm."
    });
  }
};