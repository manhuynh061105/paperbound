import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { toast } from 'react-toastify';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        const response = await userService.login({ email, password });
        
        if (response.data.success) {
          const userData = response.data.user; 
          const token = response.data.token;
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          onLoginSuccess(userData);
          
          toast.success(`👋 Chào mừng ${userData.name} đã quay trở lại!`);
          navigate('/');
        }
      } else {
        const registerData = {
          full_name: fullName,
          email: email,
          password: password,
          phone: phone 
        };

        const response = await userService.register(registerData);
        
        if (response.data.success) {
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          
          toast.success('🎉 Đăng ký tài khoản thành công! Hãy đăng nhập nhé.');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Có lỗi kết nối xảy ra, vui lòng thử lại!";
      toast.error(`❌ Thất bại: ${errorMsg}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.authBox}>
        
        <div style={styles.welcomeHeader}>
          <h2 style={styles.mainTitle}>PaperBound</h2>
          <p style={styles.subTitle}>
            {isLogin ? 'Chào mừng bạn quay trở lại với không gian sách' : 'Tham gia cộng đồng yêu sách cùng chúng tôi'}
          </p>
        </div>

        
        <div style={styles.tabHeader}>
          <button 
            type="button"
            style={{
              ...styles.tabBtn, 
              borderBottom: isLogin ? '3px solid #E67E22' : '3px solid transparent', 
              color: isLogin ? '#E67E22' : '#888888',
              backgroundColor: isLogin ? 'rgba(230, 126, 34, 0.04)' : 'transparent'
            }} 
            onClick={() => setIsLogin(true)}
          >
            Đăng Nhập
          </button>
          <button 
            type="button"
            style={{
              ...styles.tabBtn, 
              borderBottom: !isLogin ? '3px solid #E67E22' : '3px solid transparent', 
              color: !isLogin ? '#E67E22' : '#888888',
              backgroundColor: !isLogin ? 'rgba(230, 126, 34, 0.04)' : 'transparent'
            }} 
            onClick={() => setIsLogin(false)}
          >
            Đăng Ký
          </button>
        </div>

        
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div style={styles.inputWrapper}>
                <input 
                  type="text" 
                  placeholder="Họ và tên của bạn" 
                  required 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  style={styles.input} 
                />
              </div>
              <div style={styles.inputWrapper}>
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
              </div>
            </>
          )}
          
          <div style={styles.inputWrapper}>
            <input 
              type="email" 
              placeholder="Địa chỉ Email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={styles.input} 
            />
          </div>
          <div style={styles.inputWrapper}>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={styles.input} 
            />
          </div>
          
          {isLogin && (
            <div style={styles.forgotPassRow}>
              <span style={styles.forgotPassText}>Quên mật khẩu?</span>
            </div>
          )}

          <button 
            type="submit" 
            style={{
              ...styles.submitBtn,
              transform: isHovered ? 'translateY(-1px)' : 'none',
              boxShadow: isHovered ? '0 6px 20px rgba(44, 62, 80, 0.25)' : '0 4px 12px rgba(44, 62, 80, 0.15)',
              backgroundColor: isHovered ? '#34495E' : '#2C3E50'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isLogin ? 'ĐĂNG NHẬP HỆ THỐNG' : 'TẠO TÀI KHOẢN MỚI'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '75vh', 
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  authBox: { 
    backgroundColor: '#ffffff', 
    padding: '40px', 
    borderRadius: '16px', 
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 8px rgba(0, 0, 0, 0.02)', 
    width: '420px', 
    boxSizing: 'border-box',
    transition: 'all 0.3s ease'
  },
  welcomeHeader: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  mainTitle: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    color: '#2C3E50',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  subTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#7F8C8D',
    lineHeight: '1.5'
  },
  tabHeader: { 
    display: 'flex', 
    marginBottom: '25px', 
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    padding: '4px'
  },
  tabBtn: { 
    flex: 1, 
    padding: '12px', 
    background: 'none', 
    border: 'none', 
    fontSize: '15px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    borderRadius: '6px',
    transition: 'all 0.2s ease-in-out',
    outline: 'none'
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '18px' 
  },
  inputWrapper: {
    width: '100%'
  },
  input: { 
    padding: '14px 16px', 
    borderRadius: '8px', 
    border: '1px solid #E2E8F0', 
    fontSize: '14px', 
    outline: 'none', 
    boxSizing: 'border-box', 
    width: '100%',
    color: '#2D3748',
    backgroundColor: '#FAFAFA',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#E67E22',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(230, 126, 34, 0.15)'
    }
  },
  forgotPassRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-4px'
  },
  forgotPassText: {
    fontSize: '13px',
    color: '#7F8C8D',
    cursor: 'pointer',
    transition: 'color 0.2s',
    ':hover': { color: '#E67E22' }
  },
  submitBtn: { 
    color: '#ffffff', 
    border: 'none', 
    padding: '14px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '15px', 
    marginTop: '5px', 
    width: '100%', 
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease'
  }
};

export default AuthPage;