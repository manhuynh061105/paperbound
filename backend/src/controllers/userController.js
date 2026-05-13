const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // Kiểm tra email tồn tại chưa
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Lưu người dùng
    const newUser = await User.create({ full_name, email, password, phone });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user || user.password !== password) { // Lưu ý: Sau này sẽ dùng bcrypt để so sánh pass đã mã hóa
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Tạm thời trả về thông tin user (Sau này sẽ trả về Token JWT)
    res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login };