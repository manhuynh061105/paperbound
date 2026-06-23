import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, categoryService, cartService } from '../services/api';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const MenuPage = ({ refreshCartCount }) => {
  const navigate = useNavigate();
  
  // --- STATE QUẢN LÝ DỮ LIỆU THẬT ---
  const [products, setProducts] = useState([]);
  const [structuredCategories, setStructuredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE QUẢN LÝ BỘ LỌC (FILTER) & PHÂN TRANG ---
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedMainCat, setSelectedMainCat] = useState('all');
  const [selectedSubCat, setSelectedSubCat] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [hoveredProductId, setHoveredProductId] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  // Đọc các bộ lọc được truyền từ Header qua URL query strings
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category'); 
  const searchFilter = searchParams.get('search');     

  // 1. LẤY DANH MỤC VÀ PHÂN CẤP TỪ API
  useEffect(() => {
    categoryService.getAll()
      .then(res => {
        const allCats = res.data.data || res.data || [];
        const mainCats = allCats.filter(cat => !cat.parent_id);
        const hierarchy = mainCats.map(main => ({
          ...main,
          sub: allCats.filter(sub => sub.parent_id && sub.parent_id.toString() === main.id.toString())
        }));
        setStructuredCategories(hierarchy);
      })
      .catch(err => console.error("Lỗi nạp danh mục tại trang Menu:", err));
  }, []);

  // 2. 🌟 BỔ SUNG: ĐỒNG BỘ URL QUERY VÀO STATE CỦA MENU PAGE KHI HEADER THAY ĐỔI
  useEffect(() => {
    if (searchFilter) {
      setSearchQuery(searchFilter);
    } else {
      setSearchQuery('');
    }

    if (categoryFilter && structuredCategories.length > 0) {
      const catIdStr = categoryFilter.toString();
      
      // Kiểm tra xem ID truyền vào là danh mục chính hay phụ
      const isMainCat = structuredCategories.some(c => c.id.toString() === catIdStr);
      
      if (isMainCat) {
        setSelectedMainCat(catIdStr);
        setSelectedSubCat('all');
      } else {
        // Nếu là danh mục phụ, tìm xem danh mục cha của nó là ai để active cả 2 dropdown
        const parentCat = structuredCategories.find(main => 
          main.sub?.some(sub => sub.id.toString() === catIdStr)
        );
        if (parentCat) {
          setSelectedMainCat(parentCat.id.toString());
          setSelectedSubCat(catIdStr);
        } else {
          setSelectedMainCat('all');
          setSelectedSubCat('all');
        }
      }
    } else if (!categoryFilter) {
      setSelectedMainCat('all');
      setSelectedSubCat('all');
    }
    setCurrentPage(1); // Reset về trang 1 khi đổi bộ lọc
  }, [categoryFilter, searchFilter, structuredCategories]);

  // 3. LẤY SẢN PHẨM THỰC TẾ TỪ DATABASE & TIẾN HÀNH PHÂN LOẠI LỌC TRÊN GIAO DIỆN
  useEffect(() => {
    setLoading(true);
    productService.getAll()
      .then(res => {
        let allProducts = res.data.data || res.data || [];

        // Logic lọc theo thanh Tìm kiếm
        if (searchQuery.trim() !== '') {
          const key = searchQuery.toLowerCase().trim();
          allProducts = allProducts.filter(p => 
            (p.title && p.title.toLowerCase().includes(key)) || 
            (p.author && p.author.toLowerCase().includes(key))
          );
        }

        // Logic lọc danh mục
        if (selectedMainCat !== 'all' && selectedSubCat === 'all') {
          const currentMainObj = structuredCategories.find(c => c.id.toString() === selectedMainCat.toString());
          const subIds = currentMainObj?.sub?.map(s => s.id.toString()) || [];
          
          allProducts = allProducts.filter(p => {
            const pCatIds = p.category_ids ? p.category_ids.map(id => id.toString()) : [];
            return pCatIds.includes(selectedMainCat.toString()) || pCatIds.some(id => subIds.includes(id));
          });
        } else if (selectedSubCat !== 'all') {
          allProducts = allProducts.filter(p => {
            const pCatIds = p.category_ids ? p.category_ids.map(id => id.toString()) : [];
            return pCatIds.includes(selectedSubCat.toString());
          });
        }

        // Sắp xếp nâng cao
        if (sortBy === 'latest') {
          allProducts.sort((a, b) => b.id - a.id);
        } else if (sortBy === 'oldest') {
          allProducts.sort((a, b) => a.id - b.id);
        } else if (sortBy === 'price-asc') {
          allProducts.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortBy === 'price-desc') {
          allProducts.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (sortBy === 'title-asc') {
          allProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }

        setProducts(allProducts);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi nạp sản phẩm tại trang Menu:", err);
        setLoading(false);
      });
  // ✨ ĐÃ THÊM: categoryFilter và searchFilter vào dependency array bên dưới để React trigger render lại
  }, [searchQuery, selectedMainCat, selectedSubCat, sortBy, structuredCategories, categoryFilter, searchFilter]);

  // --- XỬ LÝ THÊM VÀO GIỎ HÀNG THẬT ---
  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (!userId) {
      toast.warning("🔒 Vui lòng đăng nhập tài khoản để thêm sách vào giỏ hàng!");
      navigate('/auth');
      return;
    }

    try {
      const response = await cartService.add({
        userId: userId,
        productId: product.id,
        quantity: 1
      });

      if (response.data.success) {
        toast.success(`🛒 Đã thêm "${product.title}" vào giỏ hàng!`);
        refreshCartCount();
      }
    } catch (error) {
      toast.error("Không thể thêm vào giỏ hàng: " + (error.response?.data?.message || error.message));
    }
  };

  // --- LOGIC PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handleMainCatChange = (e) => {
    const value = e.target.value;
    setSelectedMainCat(value);
    setSelectedSubCat('all'); 
    setCurrentPage(1);
    
    // Đồng bộ ngược lại URL để giữ tính nhất quán
    if (value === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?category=${value}`);
    }
  };

  const handleSubCatChange = (e) => {
    const value = e.target.value;
    setSelectedSubCat(value);
    setCurrentPage(1);

    // Đồng bộ ngược lại URL
    if (value === 'all') {
      navigate(`/products?category=${selectedMainCat}`);
    } else {
      navigate(`/products?category=${value}`);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.mainContentLayout}>
        
        <div style={styles.breadcrumb}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span style={{ color: '#2C3E50', fontWeight: 'bold' }}>Tất cả sách</span>
        </div>

        <div style={styles.menuLayout}>
          
          {/* ================= SIDEBAR CHỨA BỘ LỌC ================= */}
          <aside style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>🔍 Bộ lọc tìm kiếm</h3>
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Từ khóa tìm kiếm</label>
              <div style={styles.searchBoxWrapper}>
                <input 
                  type="text"
                  placeholder="Nhập tên sách, tác giả..."
                  value={searchQuery}
                  onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    setCurrentPage(1);
                    if(!e.target.value) navigate('/products');
                  }}
                  style={styles.sidebarSearchInput}
                />
                {searchQuery && (
                  <span style={styles.clearSearchBtn} onClick={() => { setSearchQuery(''); navigate('/products'); }}>✕</span>
                )}
              </div>
            </div>

            {/* Dropdown Danh mục chính */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Danh mục chính</label>
              <select 
                value={selectedMainCat} 
                onChange={handleMainCatChange} 
                style={styles.selectInput}
              >
                <option value="all">📚 Tất cả danh mục chính</option>
                {structuredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Dropdown Danh mục phụ */}
            {selectedMainCat !== 'all' && structuredCategories.find(c => c.id.toString() === selectedMainCat.toString())?.sub?.length > 0 && (
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Thể loại chi tiết</label>
                <select 
                  value={selectedSubCat} 
                  onChange={handleSubCatChange} 
                  style={styles.selectInput}
                >
                  <option value="all">📂 Tất cả thể loại con</option>
                  {structuredCategories
                    .find(c => c.id.toString() === selectedMainCat.toString())
                    ?.sub.map(subItem => (
                      <option key={subItem.id} value={subItem.id}>{subItem.name}</option>
                    ))}
                </select>
              </div>
            )}

            {/* Dropdown Sắp xếp */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sắp xếp theo</label>
              <select 
                value={sortBy} 
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} 
                style={styles.selectInput}
              >
                <option value="latest">⏱️ Sách mới ra mắt</option>
                <option value="oldest">⏳ Sách phát hành trước</option>
                <option value="price-asc">💵 Giá từ thấp đến cao</option>
                <option value="price-desc">💸 Giá từ cao đến thấp</option>
                <option value="title-asc">🔤 Tựa sách từ A - Z</option>
              </select>
            </div>

            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '15px', textAlign: 'center' }}>
              Tìm thấy <b>{products.length}</b> cuốn sách phù hợp.
            </div>
          </aside>

          {/* ================= LƯỚI GRID HIỂN THỊ SẢN PHẨM ================= */}
          <main style={styles.contentArea}>
            {loading ? (
              <div style={styles.loadingText}>✨ Đang nạp dữ liệu không gian sách...</div>
            ) : currentItems.length === 0 ? (
              <div style={styles.emptyBlock}>
                <p>Hiện không tìm thấy cuốn sách nào phù hợp với bộ lọc đã chọn.</p>
              </div>
            ) : (
              <div>
                <div style={styles.productGrid}>
                  {currentItems.map(product => {
                    const isHovered = hoveredProductId === product.id;
                    return (
                      <div 
                        key={product.id} 
                        style={{
                          ...styles.productCard,
                          transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                          boxShadow: isHovered ? '0 6px 15px rgba(0,0,0,0.08)' : '0 3px 10px rgba(0,0,0,0.04)',
                          borderColor: isHovered ? '#F14D5C' : '#eef0f2'
                        }}
                        onMouseEnter={() => setHoveredProductId(product.id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <img 
                          src={product.cover_image || 'https://via.placeholder.com/150x200?text=No+Cover'} 
                          alt={product.title} 
                          style={styles.gridImage}
                        />
                        <div style={styles.cardBody}>
                          <h3 style={{
                            ...styles.productTitle,
                            color: isHovered ? '#F14D5C' : '#2C3E50'
                          }} title={product.title}>
                            {product.title}
                          </h3>
                          <p style={styles.authorText}>✍️ {product.author || 'Chưa rõ'}</p>
                          <div style={styles.rowFlex}>
                            <span style={styles.gridPrice}>{Number(product.price).toLocaleString()} đ</span>
                            <span style={styles.gridRating}>⭐ {Number(product.rating || 5).toFixed(1)}</span>
                          </div>
                          <button 
                            onClick={(e) => handleAddToCart(e, product)} 
                            style={{
                              ...styles.addToCartBtn,
                              backgroundColor: isHovered ? '#F14D5C' : '#2C3E50'
                            }}
                          >
                            🛒 Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* THANH PHÂN TRANG */}
                {totalPages > 1 && (
                  <div style={styles.paginationRow}>
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      style={styles.pageArrowBtn}
                    >
                      Trước
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx + 1}
                        onClick={() => setCurrentPage(idx + 1)}
                        style={{
                          ...styles.pageNumberBtn,
                          backgroundColor: currentPage === idx + 1 ? '#F14D5C' : '#ffffff',
                          color: currentPage === idx + 1 ? '#ffffff' : '#2C3E50',
                          borderColor: currentPage === idx + 1 ? '#F14D5C' : '#ddd',
                          fontWeight: currentPage === idx + 1 ? 'bold' : 'normal'
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}

                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      style={styles.pageArrowBtn}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
};

const styles = {
  pageWrapper: { backgroundColor: '#f8f9fa', minHeight: '100vh', width: '100%', fontFamily: 'system-ui, sans-serif' },
  mainContentLayout: { maxWidth: '1200px', margin: '0 auto', padding: '20px 15px', boxSizing: 'border-box' },
  breadcrumb: { display: 'flex', gap: '8px', fontSize: '13px', color: '#7f8c8d', marginBottom: '20px' },
  menuLayout: { display: 'flex', gap: '25px', alignItems: 'flex-start' },
  
  sidebar: { width: '260px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #eef0f2', position: 'sticky', top: '20px' },
  sidebarTitle: { margin: '0 0 18px 0', fontSize: '16px', fontWeight: 'bold', color: '#2C3E50' },
  filterGroup: { marginBottom: '15px' },
  filterLabel: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' },
  selectInput: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', color: '#333', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' },
  
  // Style mới cho thanh tìm kiếm ở sidebar
  searchBoxWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  sidebarSearchInput: { width: '100%', padding: '10px 30px 10px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', color: '#333', outline: 'none' },
  clearSearchBtn: { position: 'absolute', right: '10px', color: '#ccc', cursor: 'pointer', fontSize: '12px', '&:hover': { color: '#666' } },

  contentArea: { flex: 1 },
  loadingText: { padding: '80px', textAlign: 'center', fontSize: '16px', color: '#555', fontWeight: 'bold' },
  emptyBlock: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', color: '#7f8c8d' },
  
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '20px' },
  productCard: { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #eef0f2', cursor: 'pointer', transition: 'all 0.25s ease' },
  gridImage: { width: '100%', height: '245px', objectFit: 'cover' },
  cardBody: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' },
  productTitle: { margin: '0', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '38px', transition: 'color 0.2s' },
  authorText: { fontSize: '12px', color: '#7f8c8d', margin: 0 },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gridPrice: { color: '#E67E22', fontWeight: 'bold', fontSize: '15px' },
  gridRating: { fontSize: '12px', color: '#f1c40f', fontWeight: 'bold' },
  addToCartBtn: { color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', marginTop: '5px', transition: 'background-color 0.2s' },

  paginationRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '35px', borderTop: '1px solid #eef0f2', paddingTop: '20px' },
  pageArrowBtn: { padding: '8px 14px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' },
  pageNumberBtn: { width: '34px', height: '34px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }
};

export default MenuPage;