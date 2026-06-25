import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, categoryService } from '../services/api';

const Header = ({ cartCount, userRole, currentUser, openAdminModal, openCategoryModal, onLogout }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isUserHovered, setIsUserHovered] = useState(false);
  const [isAdminHovered, setIsAdminHovered] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [structuredCategories, setStructuredCategories] = useState([]);

  useEffect(() => {
    productService.getAll()
      .then(res => {
        const prods = res.data?.data || res.data || [];
        setAllProducts(prods);
      })
      .catch(err => console.error(err));
  }, []);

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
    setSuggestedProducts(filtered.slice(0, 5));
  }, [searchKey, allProducts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      .catch(err => console.error(err));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKey.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchKey.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const handleSelectSuggestion = (productId) => {
    navigate(`/products/${productId}`);
    setSearchKey('');
    setIsSearchFocused(false);
  };

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

      <div style={styles.logoSection} onClick={() => navigate('/')}>
        <h1 style={styles.logoText}>PAPERBOUND<span style={{ color: '#E67E22' }}>.</span></h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={styles.menuContainer}
          onMouseEnter={() => setIsCategoryHovered(true)}
          onMouseLeave={() => setIsCategoryHovered(false)}
        >
          <button style={{
            ...styles.categoryTriggerBtn,
            backgroundColor: isCategoryHovered ? '#F8FAFC' : '#ffffff',
            color: isCategoryHovered ? '#E67E22' : '#2C3E50',
            borderColor: isCategoryHovered ? '#E67E22' : '#E2E8F0'
          }}>
            ☰ Danh mục <span style={styles.arrowIcon}>▾</span>
          </button>
          
          {isCategoryHovered && structuredCategories.length > 0 && (
            <div style={styles.dropdownWrapper}>
              <div style={styles.dropdownMenu} className="smooth-dropdown">
                {structuredCategories.map(cat => (
                  <div 
                    key={cat.id} 
                    style={styles.categoryItem} 
                    className="hover-category-item" 
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                    {cat.sub && cat.sub.length > 0 && <span style={{ fontSize: '10px', color: '#94A3B8' }}>▶</span>}
                    
                    {cat.sub && cat.sub.length > 0 && (
                      <div style={styles.subCategoryWrapper}>
                        <div style={styles.subCategoryMenu} className="smooth-dropdown">
                          {cat.sub.map(subItem => (
                            <div 
                              key={subItem.id} 
                              style={styles.subItem} 
                              className="hover-sub-item" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryClick(subItem.id);
                              }}
                            >
                              {subItem.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/products')}
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
          style={{
            ...styles.categoryTriggerBtn,
            backgroundColor: isMenuHovered ? '#F8FAFC' : '#ffffff',
            color: isMenuHovered ? '#E67E22' : '#2C3E50',
            borderColor: isMenuHovered ? '#E67E22' : '#E2E8F0'
          }}
        >
          📖 Tất cả sách
        </button>
      </div>

      <div style={styles.searchWrapper} ref={dropdownRef}>
        <form onSubmit={handleSearchSubmit} style={{
          ...styles.searchBarContainer,
          borderColor: isSearchFocused ? '#E67E22' : '#E2E8F0',
          boxShadow: isSearchFocused ? '0 0 0 3px rgba(230, 126, 34, 0.15)' : 'none'
        }}>
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

        {isSearchFocused && suggestedProducts && suggestedProducts.length > 0 && (
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

      <div style={styles.navActions}>
        {currentUser && userRole === 'admin' && (
          <div 
            style={styles.menuContainer}
            onMouseEnter={() => setIsAdminHovered(true)}
            onMouseLeave={() => setIsAdminHovered(false)}
          >
            <button style={{
              ...styles.adminBtn,
              backgroundColor: isAdminHovered ? '#2C3E50' : '#ffffff',
              color: isAdminHovered ? '#ffffff' : '#2C3E50',
              borderColor: '#2C3E50'
            }}>
              ⚙️ Quản lý <span style={styles.arrowIcon}>▾</span>
            </button>
            {isAdminHovered && (
              <div style={styles.dropdownWrapperAdmin}>
                <div style={styles.dropdownMenuAdmin} className="smooth-dropdown">
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
              </div>
            )}
          </div>
        )}

        <div style={styles.cartIconWrapper} className="cart-bounce" onClick={() => currentUser ? navigate('/cart') : navigate('/auth')}>
          <span style={styles.cartIconSpan}>🛒</span>
          {currentUser && cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
        </div>

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
              <span style={styles.userNameText}>{currentUser.name || 'User'} <span style={styles.arrowIcon}>▾</span></span>
            </div>
            {isUserHovered && (
              <div style={styles.dropdownWrapperUser}>
                <div style={styles.dropdownMenuUser} className="smooth-dropdown">
                  <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/profile'); setIsUserHovered(false); }}>📂 Hồ sơ cá nhân</div>
                  <div style={styles.dropdownItem} className="hover-sub-item" onClick={() => { navigate('/orders-history'); setIsUserHovered(false); }}>📜 Lịch sử đơn hàng</div>
                  <hr style={styles.divider} />
                  <div style={{ ...styles.dropdownItem, color: '#E74C3C' }} className="hover-logout-item" onClick={() => { onLogout(); setIsUserHovered(false); }}>🚪 Đăng xuất</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const dropdownAnimationCSS = `
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .smooth-dropdown {
    animation: slideInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .hover-category-item:hover { background-color: #F8FAFC !important; color: #E67E22 !important; }
  .hover-category-item:hover > div { display:block !important; }
  .hover-sub-item:hover { background-color: #F8FAFC !important; color: #E67E22 !important; }
  .hover-logout-item:hover { background-color: #FEF2F2 !important; }
  .cart-bounce:hover { transform: scale(1.1); transition: transform 0.2s ease; }
  .hover-suggestion-item:hover { background-color: #F8FAFC; cursor: pointer; }
`;

const styles = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '14px 6%', boxShadow: '0 1px 10px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #F1F5F9', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: 'border-box' },
  logoSection: { cursor: 'pointer' },
  logoText: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#2C3E50', letterSpacing: '0.8px' },
  menuContainer: { position: 'relative', padding: '10px 0' },
  categoryTriggerBtn: { border: '1px solid #E2E8F0', padding: '9px 18px', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '13.5px', transition: 'all 0.15s ease-in-out', display: 'flex', alignItems: 'center', gap: '4px', outline: 'none' },
  arrowIcon: { fontSize: '11px', opacity: 0.7 },
  dropdownWrapper: { position: 'absolute', top: '100%', left: 0, width: '240px', paddingTop: '4px', zIndex: 200 },
  dropdownMenu: { backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRadius: '12px', padding: '6px 0', border: '1px solid #E2E8F0' },
  categoryItem: { position: 'relative', padding: '11px 18px', cursor: 'pointer', color: '#334155', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' },
  subCategoryWrapper: { display: 'none', position: 'absolute', top: '-7px', left: '100%', width: '200px', paddingLeft: '6px' },
  subCategoryMenu: { backgroundColor: '#ffffff', boxShadow: '10px 10px 30px rgba(0,0,0,0.08)', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '6px 0' },
  subItem: { padding: '10px 18px', color: '#475569', fontSize: '13.5px', transition: 'all 0.15s' },
  searchWrapper: { position: 'relative', flex: 1, margin: '0 30px', maxWidth: '420px' },
  searchBarContainer: { display: 'flex', border: '1px solid #E2E8F0', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#F8FAFC', transition: 'all 0.2s ease-in-out' },
  searchInput: { flex: 1, padding: '10px 18px', border: 'none', outline: 'none', fontSize: '13.5px', color: '#1E293B', backgroundColor: 'transparent', width: '100%' },
  searchBtn: { backgroundColor: 'transparent', border: 'none', padding: '0 16px', cursor: 'pointer', fontSize: '14px' },
  searchSuggestionsDropdown: { position: 'absolute', top: '115%', left: 0, right: 0, backgroundColor: '#ffffff', boxShadow: '0 12px 32px rgba(0,0,0,0.1)', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', zIndex: 999, padding: '6px 0' },
  suggestionItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', transition: 'background-color 0.15s' },
  suggestionImage: { width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' },
  suggestionInfo: { display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 },
  suggestionTitle: { fontSize: '13px', fontWeight: '600', color: '#2C3E50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  suggestionAuthor: { fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  suggestionPrice: { fontSize: '12.5px', fontWeight: '700', color: '#E67E22' },
  navActions: { display: 'flex', alignItems: 'center', gap: '24px' },
  adminBtn: { border: '1px solid #2C3E50', padding: '8px 18px', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.15s ease-in-out', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px' },
  dropdownWrapperAdmin: { position: 'absolute', top: '100%', right: 0, width: '220px', paddingTop: '4px', zIndex: 200 },
  dropdownMenuAdmin: { backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRadius: '12px', padding: '6px 0', border: '1px solid #E2E8F0' },
  cartIconWrapper: { position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  cartIconSpan: { fontSize: '22px', color: '#2C3E50' },
  cartBadge: { position: 'absolute', top: '-2px', right: '-4px', backgroundColor: '#E67E22', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: '700' },
  loginBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '13.5px', transition: 'opacity 0.15s' },
  userProfileTrigger: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0' },
  avatarImg: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0' },
  googleAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2C3E50', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' },
  userNameText: { fontSize: '13.5px', fontWeight: '600', color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '4px' },
  dropdownWrapperUser: { position: 'absolute', top: '100%', right: 0, width: '190px', paddingTop: '4px', zIndex: 200 },
  dropdownMenuUser: { backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRadius: '12px', padding: '6px 0', border: '1px solid #E2E8F0' },
  dropdownItem: { padding: '11px 18px', fontSize: '13.5px', color: '#334155', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  divider: { border: 'none', borderTop: '1px solid #F1F5F9', margin: '4px 0' }
};

export default Header;