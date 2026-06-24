const pool = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcrypt'); // ⚡️ Import thư viện mã hóa mật khẩu

const SALT_ROUNDS = 10; // Số vòng lặp băm dữ liệu (tiêu chuẩn bảo mật)

// 1. ĐĂNG KÝ TÀI KHOẢN (Có mã hóa)
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại trên hệ thống!" });
    }

    // 🔥 Tiến hành mã hóa mật khẩu trước khi ném vào database
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await User.create({ 
      full_name, 
      email, 
      password: hashedPassword, // Lưu mật khẩu đã mã hóa
      phone 
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ĐĂNG NHẬP HỆ THỐNG (Có giải mã đối chiếu)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
    }

    // 🔥 Sử dụng bcrypt.compare để đối chiếu mật khẩu thuần nhập vào với chuỗi hash trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Đăng nhập thành công!", 
      user: { 
        id: user.id, 
        name: user.full_name,
        email: user.email, 
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. LẤY THÔNG TIN PROFILE CHI TIẾT
const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. CẬP NHẬT THÔNG TIN PROFILE & ĐỔI MẬT KHẨU (Có mã hóa)
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, avatar, current_password, new_password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    const fullUserDetail = await User.findByEmail(user.email);
    let finalPassword = fullUserDetail.password; // Mặc định giữ nguyên pass cũ đã hash trong DB

    // Nếu người dùng có nhu cầu đổi mật khẩu mới
    if (new_password) {
      // 🔥 Xác thực mật khẩu hiện tại bằng bcrypt.compare
      const isCurrentMatch = await bcrypt.compare(current_password, fullUserDetail.password);
      if (!isCurrentMatch) {
        return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
      }
      
      // 🔥 Mã hóa mật khẩu mới trước khi lưu
      finalPassword = await bcrypt.hash(new_password, SALT_ROUNDS);
    }

    const query = `
      UPDATE users 
      SET full_name = $1, phone = $2, avatar = $3, password = $4
      WHERE id = $5
      RETURNING id, full_name, email, phone, role, avatar, created_at
    `;
    const result = await pool.query(query, [full_name, phone, avatar, finalPassword, id]); 
    const updatedUser = result.rows[0];

    res.status(200).json({ 
      success: true, 
      message: "Cập nhật hồ sơ thành công!", 
      data: {
        id: updatedUser.id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      } 
    });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };