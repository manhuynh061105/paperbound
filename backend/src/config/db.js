const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST !== 'localhost';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // 🔥 TỰ ĐỘNG BẬT SSL KHI DEPLOY (Không cần sửa code khi lên server)
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;