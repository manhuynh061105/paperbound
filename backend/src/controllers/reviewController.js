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

    let review_image = null;
    
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(f => f.fieldname === 'reviewImage');
      if (imageFile) {
        review_image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
      }
    }

    await Review.create({ 
      user_id: parseInt(user_id), 
      product_id: parseInt(product_id), 
      rating: parseInt(rating), 
      comment,
      review_image 
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
  const { id } = req.params;
  
  try {
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
    }

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