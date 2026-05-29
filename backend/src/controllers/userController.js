const pool = require('../config/db');
const User = require('../models/User');

// 1. ĐĂNG KÝ TÀI KHOẢN
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại trên hệ thống!" });
    }

    const newUser = await User.create({ full_name, email, password, phone });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ĐĂNG NHẬP HỆ THỐNG
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user || user.password !== password) { 
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
    }

    // Cập nhật để trả về đầy đủ avatar và phone phục vụ lưu Session ở Frontend
    res.status(200).json({ 
      success: true, 
      message: "Đăng nhập thành công!", 
      user: { 
        id: user.id, 
        name: user.full_name, // Khớp với trường 'name' ở state Frontend chúng ta vừa làm
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

// 3. BỔ SUNG: LẤY THÔNG TIN PROFILE CHI TIẾT
const getProfile = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID của User từ URL (Ví dụ: /api/users/profile/1)
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. BỔ SUNG: CẬP NHẬT THÔNG TIN PROFILE & AVATAR
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, avatar, current_password, new_password } = req.body;

    // 1. Kiểm tra User có tồn tại trong hệ thống không
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    // 2. Xử lý logic Đổi mật khẩu nếu người dùng yêu cầu
    let finalPassword = current_password; // Mặc định nếu không truyền mật khẩu mới thì giữ nguyên pass cũ
    
    // Nếu trong DB bạn lưu trường mật khẩu, cần lấy đầy đủ ra để đối chiếu lúc đổi pass
    const fullUserDetail = await User.findByEmail(user.email);
    finalPassword = fullUserDetail.password; // Lấy pass hiện tại trong DB làm gốc

    if (new_password) {
      if (fullUserDetail.password !== current_password) {
        return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
      }
      finalPassword = new_password; // Chấp nhận ghi đè mật khẩu mới
    }

    // 3. FIX LỖI: Sử dụng trực tiếp `pool.query` đã import ở đầu file để thực thi câu lệnh SQL
    const query = `
      UPDATE users 
      SET full_name = $1, phone = $2, avatar = $3, password = $4
      WHERE id = $5
      RETURNING id, full_name, email, phone, role, avatar, created_at
    `;
    const result = await pool.query(query, [full_name, phone, avatar, finalPassword, id]); 
    
    const updatedUser = result.rows[0];

    // 4. Trả về kết quả khớp với Session cấu trúc ở Frontend
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

// EXPORT ĐẦY ĐỦ CẢ 4 BIẾN RA NGOÀI
module.exports = { register, login, getProfile, updateProfile };