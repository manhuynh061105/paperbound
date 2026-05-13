const { Pool } = require('pg');
const path = require('path');
// Trỏ ngược ra ngoài 1 cấp để tìm file .env vì db.js đang nằm trong src/config
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;