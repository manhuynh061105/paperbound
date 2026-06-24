const pool = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); // 🔑 Import thư viện JWT Token

const SALT_ROUNDS = 10; 
const JWT_SECRET = process.env.JWT_SECRET || 'PAPERBOUND_SUPER_SECRET_KEY_2026'; // Khóa bí mật để ký token (dùng cho đồ án)

// 1. ĐĂNG KÝ TÀI KHOẢN (Có mã hóa + Sinh JWT Token)
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại trên hệ thống!" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await User.create({ 
      full_name, 
      email, 
      password: hashedPassword, 
      phone 
    });

    // 🔑 Tạo JWT Token cho người dùng mới đăng ký
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' } // Token có giá trị trong 7 ngày
    );

    res.status(201).json({ 
      success: true, 
      message: "Đăng ký thành công!",
      token, // 👈 Trả token về Frontend
      data: newUser 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ĐĂNG NHẬP HỆ THỐNG (Đối chiếu mật khẩu + Sinh JWT Token)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
    }

    // 🔑 Tạo JWT Token khi đăng nhập thành công
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({ 
      success: true, 
      message: "Đăng nhập thành công!", 
      token, // 👈 Trả token về để Frontend lưu lại quyền truy cập
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

// 4. CẬP NHẬT THÔNG TIN PROFILE & ĐỔI MẬT KHẨU
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, avatar, current_password, new_password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    const fullUserDetail = await User.findByEmail(user.email);
    let finalPassword = fullUserDetail.password;

    if (new_password) {
      const isCurrentMatch = await bcrypt.compare(current_password, fullUserDetail.password);
      if (!isCurrentMatch) {
        return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
      }
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