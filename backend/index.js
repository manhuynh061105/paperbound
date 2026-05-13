const express = require('express');
const cors = require('cors');
const logger = require('./src/middleware/loggerMiddleware');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const userRoutes = require('./src/routes/userRoutes');
const aiChatRoutes = require('./src/routes/aiChatRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Cho phép đọc dữ liệu JSON từ request body
app.use(logger);

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai-chat', aiChatRoutes);


// 1. API Test kết nối
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Paperbound API" });
});

// 2. API lấy danh sách sách (Giao diện Homepage sẽ gọi cái này)
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 3. API lấy chi tiết một cuốn sách (Dùng cho trang Product Detail)
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});