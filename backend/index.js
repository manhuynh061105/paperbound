const express = require('express');
const cors = require('cors');
const logger = require('./src/middleware/loggerMiddleware');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes'); // Chuẩn hóa require tập trung ở đây
const cartRoutes = require('./src/routes/cartRoutes');
const userRoutes = require('./src/routes/userRoutes');
const aiChatRoutes = require('./src/routes/aiChatRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
require('dotenv').config();

const app = express();

// =========================================================
// MIDDLEWARE CONFIGURATION (CẤU HÌNH HỆ THỐNG)
// =========================================================

// Tối ưu CORS: Cho phép nhận payload lớn mượt mà, không bị nghẽn mạch mã hóa
app.use(cors({
  origin: '*', // Hoặc điền chính xác URL frontend của bạn ví dụ: 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Giới hạn 50MB xử lý hoàn hảo chuỗi ảnh đại diện & ảnh bìa Base64
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(logger);

// =========================================================
// DEFINING API ROUTES (ĐỊNH NGHĨA TUYẾN ĐƯỜNG)
// =========================================================
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // Đã sửa: Sử dụng trực tiếp biến biến orderRoutes đã khai báo phía trên
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// API Gốc để test kết nối server nhanh
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Paperbound API" });
});

// =========================================================
// START SERVER (KHỞI CHẠY)
// =========================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Paperbound đang chạy mượt mành tại port: ${PORT}`);
});