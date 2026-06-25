import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarBase64, setAvatarBase64] = useState(''); 
  const [loading, setLoading] = useState(true);

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

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("⚠️ Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const phoneRegex = /^0[0-9]{8,10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("❌ Số điện thoại không hợp lệ! Phải bao gồm từ 9 đến 11 chữ số và bắt đầu bằng số 0.");
      return;
    }

    try {
      const response = await userService.updateProfile(savedUser.id, {
        full_name: fullName,
        phone: phone,
        avatar: avatarBase64 
      });

      if (response.data.success) {
        toast.success("✨ Cập nhật thông tin cá nhân thành công!");
        const updatedUserSession = response.data.data;
        localStorage.setItem('user', JSON.stringify(updatedUserSession));
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      toast.error("Chỉnh sửa thất bại: " + (error.response?.data?.message || error.message));
    }
  };

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
      const response = await userService.updateProfile(savedUser.id, {
        full_name: fullName,
        phone: phone,
        avatar: avatarBase64,
        current_password: currentPassword, 
        new_password: newPassword
      });

      if (response.data.success) {
        toast.success("🔒 Thay đổi mật khẩu thành công!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (error) {
      toast.error("Đổi mật khẩu thất bại: " + (error.response?.data?.message || "Mật khẩu hiện tại không đúng!"));
    }
  };

  if (loading) return <div style={styles.loading}>⏳ Đang tải dữ liệu tài khoản...</div>;

  const firstLetter = (fullName || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <div style={styles.container}>
      <style>{hoverStyleCSS}</style>
      <div style={styles.card}>
        <h2 style={styles.title}>📂 QUẢN LÝ HỒ SƠ CỦA BẠN</h2>
        <p style={styles.subtitle}>Thiết lập bảo mật thông tin, ảnh đại diện và mật khẩu</p>
        
        <div style={styles.layout}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              {avatarBase64 ? (
                <img src={avatarBase64} alt="User Avatar" style={styles.largeAvatar} />
              ) : (
                <div style={styles.largeGoogleAvatar}>{firstLetter}</div>
              )}
              <label className="upload-label-hover" style={styles.uploadBtnLabel}>
                📷 Thay ảnh
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={styles.badgeRole(profile?.role)}>
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

          <div style={styles.formSection}>
            {!showPasswordForm ? (
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                <h3 style={styles.sectionTitle}>Thông tin cá nhân</h3>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Họ và tên:</label>
                  <input className="input-focus-effect" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Số điện thoại (9-11 số):</label>
                  <input className="input-focus-effect" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={styles.input} placeholder="Ví dụ: 0912345678" />
                </div>

                <button className="primary-btn-hover" type="submit" style={styles.saveBtn}>LƯU CẬP NHẬT HỒ SƠ</button>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} style={styles.form}>
                <h3 style={{...styles.sectionTitle, color: '#E67E22'}}>Thay đổi mật khẩu bảo mật</h3>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mật khẩu hiện tại:</label>
                  <input className="input-focus-effect" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={styles.input} placeholder="Nhập mật khẩu đang dùng" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mật khẩu mới:</label>
                  <input className="input-focus-effect" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={styles.input} placeholder="Ít nhất 6 ký tự" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Xác nhận mật khẩu mới:</label>
                  <input className="input-focus-effect" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={styles.input} placeholder="Nhập lại mật khẩu mới" />
                </div>

                <button className="dark-btn-hover" type="submit" style={{...styles.saveBtn, backgroundColor: '#2C3E50'}}>XÁC NHẬN ĐỔI MẬT KHẨU</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const hoverStyleCSS = `
  .upload-label-hover:hover { background-color: #1A252F !important; transform: scale(1.05); }
  .primary-btn-hover:hover { background-color: #D35400 !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(230,126,34,0.3) !important; }
  .dark-btn-hover:hover { background-color: #1A252F !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(44,62,80,0.2) !important; }
  .input-focus-effect:focus { border-color: #E67E22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.1) !important; }
`;

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '60px 24px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#FAFAFA', minHeight: '80vh', boxSizing: 'border-box' },
  card: { backgroundColor: '#ffffff', padding: '45px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', width: '100%', maxWidth: '850px', boxSizing: 'border-box' },
  title: { margin: '0 0 6px 0', color: '#2C3E50', fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px' },
  subtitle: { margin: '0 0 40px 0', color: '#64748B', fontSize: '14.5px' },
  layout: { display: 'flex', gap: '48px', flexWrap: 'wrap' },
  loading: { padding: '120px 0', textAlign: 'center', color: '#64748B', fontSize: '15px', fontWeight: '500', fontFamily: 'sans-serif' },
  
  avatarSection: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '260px', borderRight: '1px solid #F1F5F9', paddingRight: '32px' },
  avatarWrapper: { position: 'relative', width: '140px', height: '140px' },
  largeAvatar: { width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #FFF7ED', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  largeGoogleAvatar: { width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#2C3E50', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '56px', boxShadow: '0 4px 12px rgba(44,62,80,0.15)' },
  uploadBtnLabel: { position: 'absolute', bottom: '4px', right: '4px', backgroundColor: '#2C3E50', color: '#ffffff', padding: '8px 14px', borderRadius: '20px', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', fontWeight: '700', transition: 'all 0.2s ease-in-out', display: 'flex', alignItems: 'center', gap: '4px' },
  
  badgeRole: (role) => ({ marginTop: '20px', backgroundColor: role === 'admin' ? '#FEF2F2' : '#EFF6FF', color: role === 'admin' ? '#EF4444' : '#3B82F6', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', border: role === 'admin' ? '1px solid #FEE2E2' : '1px solid #DBEAFE' }),
  maskedInfoBlock: { marginTop: '28px', width: '100%', textAlign: 'left', backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' },
  infoText: { margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5' },
  togglePassBtn: { background: 'none', border: 'none', color: '#E67E22', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', padding: 0, textDecoration: 'none', alignSelf: 'flex-start', transition: 'color 0.2s', marginTop: '4px' },

  formSection: { flex: 1.5, minWidth: '300px' },
  sectionTitle: { margin: '0 0 24px 0', fontSize: '19px', color: '#2C3E50', fontWeight: '700', letterSpacing: '0.3px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '600', color: '#334155', fontSize: '13.5px' },
  input: { padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease-in-out', color: '#1E293B', backgroundColor: '#ffffff', boxSizing: 'border-box', width: '100%' },
  saveBtn: { backgroundColor: '#E67E22', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14.5px', marginTop: '8px', boxShadow: '0 4px 12px rgba(230,126,34,0.25)', transition: 'all 0.2s ease-in-out', letterSpacing: '0.5px' }
};

export default ProfilePage;