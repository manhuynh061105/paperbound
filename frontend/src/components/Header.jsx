import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, categoryService, productService } from '../services/api';
import { toast } from 'react-toastify';

const Header = ({ cartCount, userRole, currentUser, openAdminModal, openCategoryModal, onLogout }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // Ref dùng để đóng ô tìm kiếm khi click ra ngoài
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const [isAdminHovered, setIsAdminHovered] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  
  // State quản lý Dropdown tìm kiếm
  const [allProducts, setAllProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // State lưu danh mục phân cấp từ Database thật
  const [structuredCategories, setStructuredCategories] = useState([]);

  // 1. Tải danh sách sản phẩm phục vụ cho cơ chế gợi ý Dropdown nhanh
  useEffect(() => {
    productService.getAll()
      .then(res => {
        const prods = res.data?.data || res.data || [];
        setAllProducts(prods);
      })
      .catch(err => console.error("Lỗi lấy danh sách sản phẩm cho thanh search:", err));
  }, []);

  // 2. Lắng nghe ô input thay đổi để lọc danh sách gợi ý thời gian thực
  useEffect(() => {
    if (!searchKey.trim()) {
      setSuggestedProducts([]);
      return;
    }
    const keyword = searchKey.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.title?.toLowerCase().includes(keyword) || 
      p.author?.toLowerCase().includes(keyword)
    );
    setSuggestedProducts(filtered.slice(0, 5)); // Chỉ gợi ý tối đa 5 sản phẩm để giao diện gọn gàng
  }, [searchKey, allProducts]);

  // 3. Đóng dropdown tìm kiếm nếu click chuột ra ngoài vùng search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Lấy danh mục từ database và phân cấp Chính - Phụ
  useEffect(() => {
    categoryService.getAll()
      .then(res => {
        const allCats = res.data.data || res.data || [];
        const mainCategories = allCats.filter(cat => !cat.parent_id);
        const hierarchy = mainCategories.map(main => {
          const subCategories = allCats.filter(sub => Number(sub.parent_id) === Number(main.id));
          return {
            ...main,
            sub: subCategories
          };
        });
        setStructuredCategories(hierarchy);
      })
      .catch(err => console.error("Lỗi lấy phân cấp danh mục trên Header:", err));
  }, []);

  // Xử lý khi nhấn nút Search hoặc nhấn Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKey.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchKey.trim())}`);
      setIsSearchFocused(false);
    }
  };

  // Xử lý khi click chọn nhanh một sản phẩm trong Dropdown gợi ý
  const handleSelectSuggestion = (productId) => {
    navigate(`/products/${productId}`);
    setSearchKey('');
    setIsSearchFocused(false);
  };

  // Điều hướng và lọc danh mục
  const handleCategoryClick = (categoryId) => {
    navigate(`/products?category=${categoryId}`);
    setIsCategoryHovered(false);
  };

  const renderGoogleAvatar = (user) => {
    if (user.avatar) {
      return <img src={user.avatar} alt="avatar" style={styles.avatarImg} />;
    }
    const firstLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();
    return <div style={styles.googleAvatar}>{firstLetter}</div>;
  };

  return (
    <header style={styles.header}>
      <style>{dropdownAnimationCSS}</style>

      {/* LOGO */}
      <div style={styles.logoSection} onClick={() => navigate('/')}>
        <h1 style={styles.logoText}>PAPERBOUND<span style={{ color: '#F14D5C' }}>.</span></h1>
      </div>

      {/* CỤM ĐIỀU HƯỚNG BÊN TRÁI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* DROPDOWN DANH MỤC PHÂN CẤP ĐỘNG */}
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
          
          {isCategoryHovered && structuredCategories.length > 0 && (
            <div style={styles.dropdownMenu} className="smooth-dropdown">
              {structuredCategories.map(cat => (
                <div 
                  key={cat.id} 
                  style={styles.categoryItem} 
                  className="hover-category-item" 
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <span>{cat.name}</span>
                  {cat.sub && cat.sub.length > 0 && <span style={{ fontSize: '11px', color: '#aaa' }}>➔</span>}
                  
                  {/* HIỂN THỊ DANH MỤC PHỤ KHI HOVER VÀO DANH MỤC CHÍNH */}
                  {cat.sub && cat.sub.length > 0 && (
                    <div style={styles.subCategoryMenu} className="smooth-dropdown">
                      {cat.sub.map(subItem => (
                        <div 
                          key={subItem.id} 
                          style={styles.subItem} 
                          className="hover-sub-item" 
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn click lan ra danh mục cha
                            handleCategoryClick(subItem.id);
                          }}
                        >
                          {subItem.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NÚT MENU TẤT CẢ SẢN PHẨM */}
        <button 
          onClick={() => navigate('/products')}
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
          style={{
            ...styles.categoryTriggerBtn,
            backgroundColor: isMenuHovered ? '#FFF2F3' : '#ffffff',
            color: isMenuHovered ? '#F14D5C' : '#444',
            borderColor: isMenuHovered ? '#F14D5C' : '#ddd'
          }}
        >
          📖 Tất cả sách
        </button>
      </div>

      {/* THANH TÌM KIẾM TÍCH HỢP DROPDOWN GỢI Ý CHUẨN */}
      <div style={styles.searchWrapper} ref={dropdownRef}>
        <form onSubmit={handleSearchSubmit} style={styles.searchBarContainer}>
          <input 
            type="text" 
            placeholder="Tìm kiếm tựa sách, tác giả bạn muốn..." 
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            style={styles.searchInput} 
          />
          <button type="submit" style={styles.searchBtn}>🔍</button>
        </form>

        {/* DROPDOWN HIỂN THỊ KẾT QUẢ GỢI Ý NHANH */}
        {isSearchFocused && suggestedProducts.length > 0 && (
          <div style={styles.searchSuggestionsDropdown} className="smooth-dropdown">
            {suggestedProducts.map(product => (
              <div 
                key={product.id} 
                style={styles.suggestionItem} 
                onClick={() => handleSelectSuggestion(product.id)}
                className="hover-suggestion-item"
              >
                <img 
                  src={product.cover_image || 'https://via.placeholder.com/40x60?text=Book'} 
                  alt={product.title} 
                  style={styles.suggestionImage} 
                />
                <div style={styles.suggestionInfo}>
                  <div style={styles.suggestionTitle}>{product.title}</div>
                  <div style={styles.suggestionAuthor}>{product.author}</div>
                  <div style={styles.suggestionPrice}>{Number(product.price).toLocaleString('vi-VN')} đ</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NAV ACTIONS */}
      <div style={styles.navActions}>
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

        {/* GIỎ HÀNG */}
        <div style={styles.cartIconWrapper} className="cart-bounce" onClick={() => currentUser ? navigate('/cart') : navigate('/auth')}>
          <span style={styles.cartIconSpan}>🛒</span>
          {currentUser && cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
        </div>

        {/* USER PROFILE */}
        {!currentUser ? (
          <button onClick={() => navigate('/auth')} style={styles.loginBtn}>👤 Đăng Nhập</button>
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
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/profile'); setIsUserHovered(false); }}>📂 Hồ sơ cá nhân</div>
                <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/orders-history'); setIsUserHovered(false); }}>📜 Lịch sử đơn hàng</div>
                <hr style={styles.divider} />
                <div style={{ ...styles.dropdownItem, color: '#e74c3c' }} className="hover-logout-item" onClick={() => { onLogout(); setIsUserHovered(false); }}>🚪 Đăng xuất</div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const dropdownAnimationCSS = `
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .smooth-dropdown {
    animation: slideInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .hover-category-item:hover { background-color: #FFF2F3 !important; color: #F14D5C !important; }
  .hover-category-item:hover > div { display: block !important; }
  .hover-sub-item:hover { background-color: #FFF2F3 !important; color: #F14D5C !important; font-weight: bold; }
  .hover-logout-item:hover { background-color: #fce4e4 !important; font-weight: bold; }
  .cart-bounce:hover { transform: scale(1.15); transition: transform 0.2s ease; }
  .hover-suggestion-item:hover { background-color: #F8F9FA; cursor: pointer; }
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
  
  // Các style nâng cấp cho Khung Search chứa Dropdown gợi ý
  searchWrapper: { position: 'relative', flex: 1, margin: '0 20px', maxWidth: '400px' },
  searchBarContainer: { display: 'flex', border: '2px solid #F14D5C', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#ffffff' },
  searchInput: { flex: 1, padding: '9px 18px', border: 'none', outline: 'none', fontSize: '13.5px', color: '#333', width: '100%' },
  searchBtn: { backgroundColor: '#F14D5C', border: 'none', color: '#fff', padding: '0 18px', cursor: 'pointer', fontSize: '14px' },
  searchSuggestionsDropdown: { position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid #E5E8E8', overflow: 'hidden', zIndex: 999, padding: '5px 0' },
  suggestionItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px', transition: 'background-color 0.15s' },
  suggestionImage: { width: '38px', height: '54px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E5E8E8' },
  suggestionInfo: { display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' },
  suggestionTitle: { fontSize: '13px', fontWeight: '700', color: '#2C3E50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  suggestionAuthor: { fontSize: '11.5px', color: '#7F8C8D' },
  suggestionPrice: { fontSize: '12px', fontWeight: '700', color: '#F14D5C' },

  navActions: { display: 'flex', alignItems: 'center', gap: '22px' },
  adminBtn: { border: '1px solid #F14D5C', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s ease' },
  cartIconWrapper: { position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  cartIconSpan: { fontSize: '23px', color: '#2C3E50' },
  cartBadge: { position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#F14D5C', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fff' },
  loginBtn: { backgroundColor: '#F14D5C', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', boxShadow: '0 4px 10px rgba(241, 77, 92, 0.2)' },
  userProfileTrigger: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  avatarImg: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #f1f2f6' },
  googleAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F14D5C', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '1px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  userNameText: { fontSize: '13.5px', fontWeight: '600', color: '#2C3E50' },
  dropdownItem: { padding: '11px 18px', fontSize: '13.5px', color: '#333', cursor: 'pointer', textAlign: 'left' },
  divider: { none: 'none', borderTop: '1px solid #f1f2f6', margin: '4px 0' }
};

export default Header;