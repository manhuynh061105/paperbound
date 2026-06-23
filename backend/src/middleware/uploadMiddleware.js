const multer = require('multer');
const storage = multer.memoryStorage(); // Hoặc diskStorage nếu muốn lưu vào thư mục
const upload = multer({ storage: storage });

module.exports = upload;