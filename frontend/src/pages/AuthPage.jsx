import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { toast } from 'react-toastify';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Các trường bổ sung khớp hoàn toàn với Model/DB của bạn
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        // ==========================================
        // XỬ LÝ ĐĂNG NHẬP THẬT (GỌI API BACKEND)
        // ==========================================
        const response = await userService.login({ email, password });
        
        if (response.data.success) {
          const userData = response.data.user; // Nhận về id, name, email, phone, role, avatar từ DB
          
          // Lưu trạng thái đăng nhập vào localStorage để giữ Session
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Thông báo cho file App.jsx biết để cập nhật lại Header ngay lập tức
          onLoginSuccess(userData);
          
          toast.success(`👋 Chào mừng ${userData.name} đã quay trở lại!`);
          navigate('/');
        }
      } else {
        // ==========================================
        // XỬ LÝ ĐĂNG KÝ THẬT (GỌI API BACKEND)
        // ==========================================
        const registerData = {
          full_name: fullName,
          email: email,
          password: password,
          phone: phone // Gửi kèm số điện thoại xuống DB
        };

        const response = await userService.register(registerData);
        
        if (response.data.success) {
          toast.success('🎉 Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
          // Reset form và chuyển sang tab Đăng nhập
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (error) {
      // Bắt toàn bộ lỗi trả về từ Backend (Ví dụ: Sai mật khẩu, Email đã tồn tại...)
      const errorMsg = error.response?.data?.message || "Có lỗi kết nối xảy ra, vui lòng thử lại!";
      toast.error(`❌ Thất bại: ${errorMsg}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.authBox}>
        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div style={styles.tabHeader}>
          <button 
            type="button"
            style={{...styles.tabBtn, borderBottom: isLogin ? '3px solid #E67E22' : 'none', color: isLogin ? '#E67E22' : '#2C3E50'}} 
            onClick={() => setIsLogin(true)}
          >
            Đăng Nhập
          </button>
          <button 
            type="button"
            style={{...styles.tabBtn, borderBottom: !isLogin ? '3px solid #E67E22' : 'none', color: !isLogin ? '#E67E22' : '#2C3E50'}} 
            onClick={() => setIsLogin(false)}
          >
            Đăng Ký
          </button>
        </div>

        {/* FORM ĐIỀN THÔNG TIN */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="Họ và tên của bạn" 
                required 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                style={styles.input} 
              />
              <input 
                type="tel" 
                placeholder="Số điện thoại liên hệ" 
                required 
                pattern="[0-9]{9,11}"
                title="Số điện thoại phải từ 9 đến 11 chữ số"
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                style={styles.input} 
              />
            </>
          )}
          
          <input 
            type="email" 
            placeholder="Địa chỉ Email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={styles.input} 
          />
          <input 
            type="password" 
            placeholder="Mật khẩu" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={styles.input} 
          />
          
          <button type="submit" style={styles.submitBtn}>
            {isLogin ? 'ĐĂNG NHẬP HỆ THỐNG' : 'TẠO TÀI KHOẢN MỚI'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh', padding: '20px' },
  authBox: { backgroundColor: '#fff', padding: '35px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', width: '380px', boxSizing: 'border-box' },
  tabHeader: { display: 'flex', marginBottom: '25px', borderBottom: '1px solid #eee' },
  tabBtn: { flex: 1, padding: '12px', background: 'none', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px 15px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%' },
  submitBtn: { backgroundColor: '#2C3E50', color: '#fff', border: 'none', padding: '14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px', width: '100%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
};

export default AuthPage;