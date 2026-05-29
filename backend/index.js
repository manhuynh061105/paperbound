const express = require('express');
const cors = require('cors');
const logger = require('./src/middleware/loggerMiddleware');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const userRoutes = require('./src/routes/userRoutes');
const aiChatRoutes = require('./src/routes/aiChatRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
require('dotenv').config();

const app = express();

// =========================================================
// MIDDLEWARE CONFIGURATION (CẤU HÌNH FIX LỖI 413)
// =========================================================
app.use(cors()); // Cho phép Frontend gọi API từ port khác

// Thay thế app.use(express.json()) cũ bằng phiên bản mở rộng 50MB để nhận chuỗi ảnh đại diện Base64
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(logger);

// =========================================================
// DEFINING API ROUTES (ĐỊNH NGHĨA TUYẾN ĐƯỜNG)
// =========================================================
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/categories', categoryRoutes);

// API Gốc để test kết nối server nhanh
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Paperbound API" });
});

// *LƯU Ý: Các API lấy sản phẩm viết trực tiếp ở đây đã được lược bỏ 
// vì nó đã được quản lý tập trung và đồng bộ trong file `./src/routes/productRoutes` của nhóm.

// =========================================================
// START SERVER (KHỞI CHẠY)
// =========================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Paperbound đang chạy mượt mà tại port: ${PORT}`);
});