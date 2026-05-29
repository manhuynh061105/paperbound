import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ cartCount, userRole, currentUser, openAdminModal, openCategoryModal, onLogout }) => {
  const navigate = useNavigate();
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const [isAdminHovered, setIsAdminHovered] = useState(false);
  const [searchKey, setSearchKey] = useState('');

  const categories = [
    { id: 1, name: 'Văn Học Trong Nước', sub: ['Tiểu Thuyết', 'Truyện Ngắn', 'Thơ'] },
    { id: 2, name: 'Kinh Tế - Đời Sống', sub: ['Quản Trị', 'Marketing', 'Tài Chính'] },
    { id: 3, name: 'Tâm Lý Kỹ Năng', sub: ['Kỹ Năng Sống', 'Phát Triển Bản Thân'] },
    { id: 4, name: 'Sách Thiếu Nhi', sub: ['Manga - Comic', 'Bách Khoa Toàn Thư'] }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKey.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchKey.trim())}`);
    }
  };

  const renderGoogleAvatar = (user) => {
    if (user.avatar) {
      return <img src={user.avatar} alt="avatar" style={styles.avatarImg} />;
    }
    const firstLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();
    return (
      <div style={styles.googleAvatar}>
        {firstLetter}
      </div>
    );
  };

  return (
    <header style={styles.header}>
      {/* KHÔNG GIAN ĐỊNH NGHĨA ANIMATION CHO DROPDOWN MƯỢT MÀ */}
      <style>{dropdownAnimationCSS}</style>

      {/* 1. LOGO TRANG WEB - CHUYỂN TOÀN BỘ ĐIỂM NHẤN SANG MÀU ĐỎ THƯƠNG HIỆU */}
      <div style={styles.logoSection} onClick={() => navigate('/')}>
        <h1 style={styles.logoText}>
          PAPERBOUND<span style={{ color: '#F14D5C' }}>.</span>
        </h1>
      </div>

      {/* 2. DROPDOWN DANH MỤC SẢN PHẨM PHỐI MÀU TRẮNG ĐỎ TINH TẾ */}
      <div 
        style={styles.menuContainer}
        onMouseEnter={() => setIsCategoryHovered(true)}
        onMouseLeave={() => setIsCategoryHovered(false)}
      >
        <button style={{
          ...styles.categoryTriggerBtn,
          backgroundColor: isCategoryHovered ? '#FFF2F3' : '#ffffff',
          color: isCategoryHovered ? '#F14D5C' : '#444',
          borderColor: isCategoryHovered ? '#F14D5C' : '#ddd'
        }}>
          ☰ Danh mục ▾
        </button>
        {isCategoryHovered && (
          <div style={styles.dropdownMenu} className="smooth-dropdown">
            {categories.map(cat => (
              <div key={cat.id} style={styles.categoryItem} className="hover-category-item">
                <span>{cat.name}</span>
                <span style={{ fontSize: '11px', color: '#aaa' }}>➔</span>
                <div style={styles.subCategoryMenu} className="smooth-dropdown">
                  {cat.sub.map((subItem, index) => (
                    <div key={index} style={styles.subItem} className="hover-sub-item" onClick={() => {
                      navigate(`/products?category=${cat.id}`);
                      setIsCategoryHovered(false);
                    }}>
                      {subItem}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. THANH TÌM KIẾM CHUẨN ĐỎ - TRẮNG THEO PHONG CÁCH FAHASA */}
      <form onSubmit={handleSearchSubmit} style={styles.searchBarContainer}>
        <input 
          type="text" 
          placeholder="Tìm kiếm tựa sách, tác giả bạn muốn..." 
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          style={styles.searchInput} 
        />
        <button type="submit" style={styles.searchBtn}>🔍</button>
      </form>

      {/* 4. HÀNH ĐỘNG HỆ THỐNG & AUTHENTICATION */}
      <div style={styles.navActions}>
        
        {/* DROPDOWN ADMIN PANEL ĐÃ ĐỒNG BỘ MÀU ĐỎ/TRẮNG SANG TRỌNG CỰC KỲ ĐỒNG NHẤT */}
        {currentUser && userRole === 'admin' && (
          <div 
            style={styles.menuContainer}
            onMouseEnter={() => setIsAdminHovered(true)}
            onMouseLeave={() => setIsAdminHovered(false)}
          >
            <button style={{
              ...styles.adminBtn,
              backgroundColor: isAdminHovered ? '#F14D5C' : '#ffffff',
              color: isAdminHovered ? '#ffffff' : '#F14D5C'
            }}>
              ⚙️ Admin Panel ▾
            </button>
            {isAdminHovered && (
              <div style={{ ...styles.dropdownMenu, right: 0, left: 'auto', width: '220px' }} className="smooth-dropdown">
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { openAdminModal(); setIsAdminHovered(false); }}>
                  ➕ Thêm sản phẩm mới
                </div>
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { openCategoryModal(); setIsAdminHovered(false); }}>
                  📁 Thêm danh mục mới
                </div>
                <hr style={styles.divider} />
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/admin/dashboard'); setIsAdminHovered(false); }}>
                  📊 Xem Dashboard
                </div>
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/admin/products'); setIsAdminHovered(false); }}>
                  📚 Quản lý sản phẩm
                </div>
              </div>
            )}
          </div>
        )}

        {/* ICON GIỎ HÀNG VỚI HUY HIỆU ĐỎ CHUẨN THƯƠNG HIỆU */}
        <div style={styles.cartIconWrapper} className="cart-bounce" onClick={() => currentUser ? navigate('/cart') : navigate('/auth')}>
          <span style={styles.cartIconSpan}>🛒</span>
          {currentUser && cartCount > 0 && (
            <span style={styles.cartBadge}>{cartCount}</span>
          )}
        </div>

        {/* KHỐI NGƯỜI DÙNG / ĐĂNG NHẬP */}
        {!currentUser ? (
          <button onClick={() => navigate('/auth')} style={styles.loginBtn}>
            👤 Đăng Nhập
          </button>
        ) : (
          <div 
            style={styles.menuContainer}
            onMouseEnter={() => setIsUserHovered(true)}
            onMouseLeave={() => setIsUserHovered(false)}
          >
            <div style={styles.userProfileTrigger}>
              {renderGoogleAvatar(currentUser)}
              <span style={styles.userNameText}>{currentUser.name || 'User'} ▾</span>
            </div>

            {isUserHovered && (
              <div style={{ ...styles.dropdownMenu, right: 0, left: 'auto', width: '190px' }} className="smooth-dropdown">
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/profile'); setIsUserHovered(false); }}>
                  📂 Hồ sơ cá nhân
                </div>
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/orders-history'); setIsUserHovered(false); }}>
                  📜 Lịch sử đơn hàng
                </div>
                <hr style={styles.divider} />
                <div style={{ ...styles.dropdownItem, color: '#e74c3c' }} className="hover-logout-item" onClick={() => { onLogout(); setIsUserHovered(false); }}>
                  🚪 Đăng xuất
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

// CSS EFFECTS ĐỘNG ĐƯỢC INJECT ĐỂ ĐẢM BẢO HOVER ĐẸP MẮT VÀ DROPDOWN TRƯỢT 🎬
const dropdownAnimationCSS = `
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .smooth-dropdown {
    animation: slideInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .hover-category-item:hover { background-color: #FFF2F3 !important; color: #F14D5C !important; }
  .hover-category-item:hover div { display: block !important; }
  .hover-sub-item:hover { background-color: #FFF2F3 !important; color: #F14D5C !important; font-weight: bold; }
  .hover-logout-item:hover { background-color: #fce4e4 !important; font-weight: bold; }
  .cart-bounce:hover { transform: scale(1.15); transition: transform 0.2s ease; }
`;

const styles = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '12px 5%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #f1f2f6' },
  logoSection: { cursor: 'pointer' },
  logoText: { margin: 0, fontSize: '23px', fontWeight: '800', color: '#2C3E50', letterSpacing: '1px', fontFamily: 'system-ui' },
  
  menuContainer: { position: 'relative', padding: '10px 0' },
  categoryTriggerBtn: { border: '1px solid #ddd', padding: '9px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', transition: 'all 0.2s ease' },
  
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#ffffff', width: '230px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: '8px', padding: '6px 0', zIndex: 200, border: '1px solid #f1f2f6' },
  categoryItem: { position: 'relative', padding: '12px 18px', cursor: 'pointer', color: '#333', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' },
  
  subCategoryMenu: { display: 'none', position: 'absolute', top: 0, left: '100%', backgroundColor: '#ffffff', width: '190px', boxShadow: '8px 8px 24px rgba(0,0,0,0.1)', borderRadius: '0 8px 8px 0', borderLeft: '2px solid #F14D5C', padding: '6px 0' },
  subItem: { padding: '10px 18px', color: '#555', fontSize: '13.5px', transition: 'all 0.15s' },

  // THANH SEACH BOX ĐỒNG BỘ VIỀN ĐỎ CHUẨN FAHASA
  searchBarContainer: { flex: 1, display: 'flex', margin: '0 30px', maxWidth: '460px', border: '2px solid #F14D5C', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#ffffff', transition: 'box-shadow 0.2s' },
  searchInput: { flex: 1, padding: '9px 18px', border: 'none', outline: 'none', fontSize: '13.5px', color: '#333' },
  searchBtn: { backgroundColor: '#F14D5C', border: 'none', color: '#fff', padding: '0 18px', cursor: 'pointer', fontSize: '14px', transition: 'opacity 0.2s' },
  
  navActions: { display: 'flex', alignItems: 'center', gap: '22px' },
  
  // ĐỔI CHO ADMIN PANEL SANG CHỮ ĐỎ NỀN TRẮNG ĐỒNG BỘ CAO CẤP
  adminBtn: { border: '1px solid #F14D5C', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s ease' },
  
  cartIconWrapper: { position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  cartIconSpan: { fontSize: '23px', color: '#2C3E50' },
  cartBadge: { position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#F14D5C', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fff' },
  
  loginBtn: { backgroundColor: '#F14D5C', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', boxShadow: '0 4px 10px rgba(241, 77, 92, 0.2)' },
  
  userProfileTrigger: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  avatarImg: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #f1f2f6' },
  googleAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F14D5C', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '1px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  
  userNameText: { fontSize: '13.5px', fontWeight: '600', color: '#2C3E50' },
  dropdownItem: { padding: '11px 18px', fontSize: '13.5px', color: '#333', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  divider: { border: 'none', borderTop: '1px solid #f1f2f6', margin: '4px 0' }
};

export default Header;