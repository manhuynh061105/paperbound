const jwt = require('jsonwebtoken');
// Thống nhất chuỗi fallback mặc định nếu trên Render chưa kịp cấu hình biến
const JWT_SECRET = process.env.JWT_SECRET || 'PAPERBOUND_SUPER_SECRET_KEY_2026';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "🔒 Truy cập bị từ chối! Bạn chưa đăng nhập hoặc thiếu Token." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Lưu thông tin giải mã (id, role) vào req
    next(); 
  } catch (error) {
    return res.status(403).json({ success: false, message: "⚠️ Token đã hết hạn hoặc không hợp lệ!" });
  }
};

module.exports = verifyToken;