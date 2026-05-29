import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarBase64, setAvatarBase64] = useState(''); // Lưu chuỗi ảnh Base64
  const [loading, setLoading] = useState(true);

  // State phục vụ tính năng đổi mật khẩu
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const savedUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!savedUser?.id) {
      toast.error("🔒 Bạn cần đăng nhập để xem trang này!");
      window.location.href = '/auth';
      return;
    }

    // Tải dữ liệu thực tế từ DB
    userService.getProfile(savedUser.id)
      .then(res => {
        if (res.data.success) {
          const u = res.data.data;
          setProfile(u);
          setFullName(u.full_name || '');
          setPhone(u.phone || '');
          setAvatarBase64(u.avatar || '');
        }
        setLoading(false);
      })
      .catch(err => {
        toast.error("Lỗi tải thông tin hồ sơ: " + err.message);
        setLoading(false);
      });
  }, []);

  // Hàm mã hóa che giấu Email (Masked Email)
  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  // Hàm xử lý khi chọn file ảnh từ máy tính -> Chuyển sang chuỗi mã hóa Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("⚠️ Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result); // Lưu chuỗi base64 để hiển thị & lưu DB
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. XỬ LÝ LƯU THAY ĐỔI THÔNG TIN CÁ NHÂN
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Validate Số điện thoại chuẩn Việt Nam (9 - 11 số, bắt đầu bằng số 0)
    const phoneRegex = /^0[0-9]{8,10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("❌ Số điện thoại không hợp lệ! Phải bao gồm từ 9 đến 11 chữ số và bắt đầu bằng số 0.");
      return;
    }

    try {
      const response = await userService.updateProfile(savedUser.id, {
        full_name: fullName,
        phone: phone,
        avatar: avatarBase64 // Đẩy chuỗi ảnh Base64 xuống DB
      });

      if (response.data.success) {
        toast.success("✨ Cập nhật thông tin cá nhân thành công!");
        
        // Đồng bộ lại dữ liệu Session
        const updatedUserSession = response.data.data;
        localStorage.setItem('user', JSON.stringify(updatedUserSession));
        
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      toast.error("Chỉnh sửa thất bại: " + (error.response?.data?.message || error.message));
    }
  };

  // 2. XỬ LÝ ĐỔI MẬT KHẨU
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("❌ Xác nhận mật khẩu mới không trùng khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự trở lên.");
      return;
    }

    try {
      // Gọi API cập nhật mật khẩu (Hàm updateProfile nhận mọi trường thay đổi)
      const response = await userService.updateProfile(savedUser.id, {
        full_name: fullName,
        phone: phone,
        avatar: avatarBase64,
        current_password: currentPassword, // Gửi thêm password để backend xác thực
        new_password: newPassword
      });

      if (response.data.success) {
        toast.success("🔒 Thay đổi mật khẩu thành công!");
        // Reset form mật khẩu
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (error) {
      toast.error("Đổi mật khẩu thất bại: " + (error.response?.data?.message || "Mật khẩu hiện tại không đúng!"));
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu tài khoản...</div>;

  const firstLetter = (fullName || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📂 QUẢN LÝ HỒ SƠ CỦA BẠN</h2>
        <p style={styles.subtitle}>Thiết lập bảo mật thông tin, ảnh đại diện và mật khẩu</p>
        
        <div style={styles.layout}>
          {/* KHỐI BÊN TRÁI: AVATAR & THÔNG TIN TÀI KHOẢN MASKED */}
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              {avatarBase64 ? (
                <img src={avatarBase64} alt="User Avatar" style={styles.largeAvatar} />
              ) : (
                <div style={styles.largeGoogleAvatar}>{firstLetter}</div>
              )}
              <label style={styles.uploadBtnLabel}>
                📷 Thay ảnh
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={styles.badgeRole}>
              {profile?.role === 'admin' ? '🛡️ QUẢN TRỊ VIÊN' : '👤 KHÁCH HÀNG'}
            </div>

            <div style={styles.maskedInfoBlock}>
              <p style={styles.infoText}><strong>Email:</strong> {maskEmail(profile?.email)}</p>
              <p style={styles.infoText}><strong>Mật khẩu:</strong> ••••••••</p>
              <button 
                type="button" 
                onClick={() => setShowPasswordForm(!showPasswordForm)} 
                style={styles.togglePassBtn}
              >
                {showPasswordForm ? "✖ Hủy đổi mật khẩu" : "🔑 Thay đổi mật khẩu"}
              </button>
            </div>
          </div>

          {/* KHỐI BÊN PHẢI: FORM CHỈNH SỬA THÔNG TIN */}
          <div style={styles.formSection}>
            {/* FORM 1: ĐỔI THÔNG TIN CÁ NHÂN */}
            {!showPasswordForm ? (
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                <h3 style={styles.sectionTitle}>Thông tin cá nhân</h3>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Họ và tên:</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Số điện thoại (9-11 số):</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={styles.input} placeholder="Ví dụ: 0912345678" />
                </div>

                <button type="submit" style={styles.saveBtn}>LƯU CẬP NHẬT HỒ SƠ</button>
              </form>
            ) : (
              /* FORM 2: ĐỔI MẬT KHẨU (XUẤT HIỆN KHI BẤM NÚT) */
              <form onSubmit={handleChangePassword} style={styles.form}>
                <h3 style={{...styles.sectionTitle, color: '#e67e22'}}>Thay đổi mật khẩu bảo mật</h3>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mật khẩu hiện tại:</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={styles.input} placeholder="Nhập mật khẩu đang dùng" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mật khẩu mới:</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={styles.input} placeholder="Ít nhất 6 ký tự" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Xác nhận mật khẩu mới:</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={styles.input} placeholder="Nhập lại mật khẩu mới" />
                </div>

                <button type="submit" style={{...styles.saveBtn, backgroundColor: '#2C3E50'}}>XÁC NHẬN ĐỔI MẬT KHẨU</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '30px 0' },
  card: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: '800px' },
  title: { margin: '0 0 5px 0', color: '#2C3E50', fontSize: '22px', fontWeight: 'bold' },
  subtitle: { margin: '0 0 35px 0', color: '#7f8c8d', fontSize: '14px' },
  layout: { display: 'flex', gap: '45px', flexWrap: 'wrap' },
  
  avatarSection: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '240px', borderRight: '1px solid #eee', paddingRight: '25px' },
  avatarWrapper: { position: 'relative', width: '130px', height: '130px' },
  largeAvatar: { width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f39c12' },
  largeGoogleAvatar: { width: '130px', height: '130px', borderRadius: '50%', backgroundColor: '#2980b9', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '54px' },
  uploadBtnLabel: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2C3E50', color: '#fff', padding: '6px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontWeight: 'bold' },
  
  badgeRole: { marginTop: '15px', backgroundColor: '#e8f4fd', color: '#2980b9', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  maskedInfoBlock: { marginTop: '25px', width: '100%', textAlign: 'left', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' },
  infoText: { margin: '0 0 10px 0', fontSize: '14px', color: '#333' },
  togglePassBtn: { background: 'none', border: 'none', color: '#E67E22', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline' },

  formSection: { flex: 1.5, minWidth: '280px' },
  sectionTitle: { margin: '0 0 20px 0', fontSize: '18px', color: '#2C3E50', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontWeight: 'bold', color: '#444', fontSize: '13px' },
  input: { padding: '11px 14px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', transition: 'border 0.2s' },
  saveBtn: { backgroundColor: '#E67E22', color: 'white', border: 'none', padding: '13px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', boxShadow: '0 3px 6px rgba(0,0,0,0.1)' }
};

export default ProfilePage; 