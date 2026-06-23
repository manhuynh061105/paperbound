// =========================================================
// KHỞI TẠO BIẾN MÔI TRƯỜNG (PHẢI ĐẶT Ở DÒNG SỐ 1)
// =========================================================
require('dotenv').config(); // Giúp nạp API_KEY từ .env trước khi các controller dịch mã

const express = require('express');
const cors = require('cors');
const logger = require('./src/middleware/loggerMiddleware');

// Import các Tuyến đường API (Routes)
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes'); 
const cartRoutes = require('./src/routes/cartRoutes');
const userRoutes = require('./src/routes/userRoutes');
const aiChatRoutes = require('./src/routes/aiChatRoutes'); 
const categoryRoutes = require('./src/routes/categoryRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

const app = express();

// =========================================================
// MIDDLEWARE CONFIGURATION (CẤU HÌNH HỆ THỐNG)
// =========================================================

// 🟢 Cấu hình CORS mở rộng - Cho phép tất cả các nguồn gọi API
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 🟢 XỬ LÝ ĐẰNG PHẲNG CHO REQ LỆNH OPTIONS (PREFLIGHT)
// Giúp vượt qua bộ lọc kiểm tra nghiêm ngặt của trình duyệt khi deploy Cloud
app.options('*', cors());

// Giới hạn xử lý chuỗi dữ liệu lớn (Base64)
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
app.use('/api/ai', aiChatRoutes);
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
  console.log(`🚀 Server Paperbound đang chạy mượt mà tại port: ${PORT}`);
});