import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService, categoryService, cartService } from '../services/api';
import { toast } from 'react-toastify';

const MenuPage = ({ refreshCartCount }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [structuredCategories, setStructuredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedMainCat, setSelectedMainCat] = useState('all');
  const [selectedSubCat, setSelectedSubCat] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredProductId, setHoveredProductId] = useState(null);

  const itemsPerPage = 12;
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;
  const categoryFilter = searchParams.get('category'); 
  const searchFilter = searchParams.get('search');     

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
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (searchFilter) {
      setSearchQuery(searchFilter);
    } else {
      setSearchQuery('');
    }

    if (categoryFilter && structuredCategories.length > 0) {
      const catIdStr = categoryFilter.toString();
      const isMainCat = structuredCategories.some(c => c.id.toString() === catIdStr);
      
      if (isMainCat) {
        setSelectedMainCat(catIdStr);
        setSelectedSubCat('all');
      } else {
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
    setCurrentPage(1);
  }, [categoryFilter, searchFilter, structuredCategories]);

  useEffect(() => {
    setLoading(true);
    productService.getAll()
      .then(res => {
        let allProducts = res.data.data || res.data || [];

        if (searchQuery.trim() !== '') {
          const key = searchQuery.toLowerCase().trim();
          allProducts = allProducts.filter(p => 
            (p.title && p.title.toLowerCase().includes(key)) || 
            (p.author && p.author.toLowerCase().includes(key))
          );
        }

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
        console.error(err);
        setLoading(false);
      });
  }, [searchQuery, selectedMainCat, selectedSubCat, sortBy, structuredCategories, categoryFilter, searchFilter]);

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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handleMainCatChange = (e) => {
    const value = e.target.value;
    setSelectedMainCat(value);
    setSelectedSubCat('all'); 
    setCurrentPage(1);
    
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
          <span style={styles.breadcrumbLink} onClick={() => navigate('/')}>Trang chủ</span>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbActive}>Tất cả sách</span>
        </div>

        <div style={styles.menuLayout}>
          
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

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Danh mục chính</label>
              <select 
                value={selectedMainCat} 
                onChange={handleMainCatChange} 
                style={styles.selectInput}
              >
                <option value="all">📚 Tất cả danh mục</option>
                {structuredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

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

            <div style={styles.resultsCounter}>
              Tìm thấy <b style={{ color: '#E67E22' }}>{products.length}</b> cuốn sách.
            </div>
          </aside>

          <main style={styles.contentArea}>
            {loading ? (
              <div style={styles.loadingText}>
                <div style={styles.spinner}></div>
                <span>Đang nạp dữ liệu không gian sách...</span>
              </div>
            ) : currentItems.length === 0 ? (
              <div style={styles.emptyBlock}>
                <p style={styles.emptyText}>Hiện không tìm thấy cuốn sách nào phù hợp với bộ lọc đã chọn.</p>
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
                          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                          boxShadow: isHovered ? '0 12px 24px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.03)',
                          borderColor: isHovered ? '#E67E22' : '#E2E8F0'
                        }}
                        onMouseEnter={() => setHoveredProductId(product.id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <div style={styles.imageContainer}>
                          <img 
                            src={product.cover_image || 'https://via.placeholder.com/150x200?text=No+Cover'} 
                            alt={product.title} 
                            style={{
                              ...styles.gridImage,
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                            }}
                          />
                        </div>
                        <div style={styles.cardBody}>
                          <div style={styles.metaInfo}>
                            <h3 style={{
                              ...styles.productTitle,
                              color: isHovered ? '#E67E22' : '#2C3E50'
                            }} title={product.title}>
                              {product.title}
                            </h3>
                            <p style={styles.authorText}>✍️ {product.author || 'Chưa rõ'}</p>
                          </div>
                          
                          <div style={styles.priceRatingRow}>
                            <span style={styles.gridPrice}>{Number(product.price).toLocaleString()} đ</span>
                            <span style={styles.gridRating}>⭐ {Number(product.rating || 5).toFixed(1)}</span>
                          </div>

                          <button 
                            onClick={(e) => handleAddToCart(e, product)} 
                            style={{
                              ...styles.addToCartBtn,
                              backgroundColor: isHovered ? '#E67E22' : '#2C3E50',
                              boxShadow: isHovered ? '0 4px 12px rgba(230, 126, 34, 0.2)' : 'none'
                            }}
                          >
                            🛒 Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div style={styles.paginationRow}>
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      style={{
                        ...styles.pageArrowBtn,
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Trước
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx + 1}
                        onClick={() => setCurrentPage(idx + 1)}
                        style={{
                          ...styles.pageNumberBtn,
                          backgroundColor: currentPage === idx + 1 ? '#E67E22' : '#ffffff',
                          color: currentPage === idx + 1 ? '#ffffff' : '#2C3E50',
                          borderColor: currentPage === idx + 1 ? '#E67E22' : '#E2E8F0',
                          fontWeight: currentPage === idx + 1 ? '700' : '500'
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}

                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      style={{
                        ...styles.pageArrowBtn,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                      }}
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
  pageWrapper: { 
    backgroundColor: '#F8FAFC', 
    minHeight: '100vh', 
    width: '100%', 
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
  },
  mainContentLayout: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '30px 15px', 
    boxSizing: 'border-box' 
  },
  breadcrumb: { 
    display: 'flex', 
    gap: '8px', 
    fontSize: '14px', 
    color: '#64748B', 
    marginBottom: '25px',
    alignItems: 'center'
  },
  breadcrumbLink: { 
    cursor: 'pointer',
    transition: 'color 0.2s',
    ':hover': { color: '#E67E22' }
  },
  breadcrumbSeparator: { 
    color: '#CBD5E1' 
  },
  breadcrumbActive: { 
    color: '#2C3E50', 
    fontWeight: '600' 
  },
  menuLayout: { 
    display: 'flex', 
    gap: '30px', 
    alignItems: 'flex-start' 
  },
  sidebar: { 
    width: '280px', 
    backgroundColor: '#ffffff', 
    padding: '24px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
    border: '1px solid #E2E8F0', 
    position: 'sticky', 
    top: '30px' 
  },
  sidebarTitle: { 
    margin: '0 0 20px 0', 
    fontSize: '16px', 
    fontWeight: '700', 
    color: '#2C3E50',
    letterSpacing: '0.3px'
  },
  filterGroup: { 
    marginBottom: '20px' 
  },
  filterLabel: { 
    display: 'block', 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: '8px' 
  },
  selectInput: { 
    width: '100%', 
    padding: '11px 14px', 
    borderRadius: '8px', 
    border: '1px solid #E2E8F0', 
    fontSize: '13.5px', 
    color: '#1E293B', 
    outline: 'none', 
    cursor: 'pointer', 
    backgroundColor: '#F8FAFC',
    transition: 'all 0.2s ease'
  },
  searchBoxWrapper: { 
    position: 'relative', 
    display: 'flex', 
    alignItems: 'center' 
  },
  sidebarSearchInput: { 
    width: '100%', 
    padding: '11px 36px 11px 14px', 
    borderRadius: '8px', 
    border: '1px solid #E2E8F0', 
    fontSize: '13.5px', 
    color: '#1E293B', 
    outline: 'none',
    backgroundColor: '#F8FAFC',
    transition: 'all 0.2s ease'
  },
  clearSearchBtn: { 
    position: 'absolute', 
    right: '12px', 
    color: '#94A3B8', 
    cursor: 'pointer', 
    fontSize: '12px',
    transition: 'color 0.2s'
  },
  resultsCounter: { 
    fontSize: '13px', 
    color: '#64748B', 
    marginTop: '20px', 
    textAlign: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #F1F5F9'
  },
  contentArea: { 
    flex: 1 
  },
  loadingText: { 
    padding: '100px 0', 
    textAlign: 'center', 
    fontSize: '15px', 
    color: '#64748B', 
    fontWeight: '600',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid #E2E8F0',
    borderTop: '3px solid #E67E22',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  emptyBlock: { 
    backgroundColor: '#ffffff', 
    padding: '60px 40px', 
    borderRadius: '16px', 
    textAlign: 'center', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
    border: '1px solid #E2E8F0' 
  },
  emptyText: {
    color: '#94A3B8',
    margin: 0,
    fontSize: '15px'
  },
  productGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
    gap: '24px' 
  },
  productCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column', 
    border: '1px solid #E2E8F0', 
    cursor: 'pointer', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
  },
  imageContainer: {
    width: '100%',
    height: '260px',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC'
  },
  gridImage: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover',
    transition: 'all 0.3s ease'
  },
  cardBody: { 
    padding: '18px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px', 
    flex: 1, 
    justifyContent: 'space-between' 
  },
  metaInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  productTitle: { 
    margin: '0', 
    fontSize: '14.5px', 
    fontWeight: '700', 
    lineHeight: '1.4', 
    display: '-webkit-box', 
    WebkitLineClamp: 2, 
    WebkitBoxOrient: 'vertical', 
    overflow: 'hidden', 
    height: '40px', 
    transition: 'color 0.2s' 
  },
  authorText: { 
    fontSize: '12.5px', 
    color: '#64748B', 
    margin: 0 
  },
  priceRatingRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: '4px'
  },
  gridPrice: { 
    color: '#E67E22', 
    fontWeight: '700', 
    fontSize: '16px' 
  },
  gridRating: { 
    fontSize: '13px', 
    color: '#F59E0B', 
    fontWeight: '700' 
  },
  addToCartBtn: { 
    color: '#ffffff', 
    border: 'none', 
    padding: '11px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '13.5px', 
    width: '100%', 
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  paginationRow: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '8px', 
    marginTop: '45px', 
    paddingTop: '25px',
    borderTop: '1px solid #E2E8F0' 
  },
  pageArrowBtn: { 
    padding: '9px 16px', 
    border: '1px solid #E2E8F0', 
    borderRadius: '8px', 
    backgroundColor: '#ffffff', 
    fontSize: '13.5px', 
    color: '#475569', 
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  pageNumberBtn: { 
    width: '38px', 
    height: '38px', 
    borderRadius: '8px', 
    border: '1px solid #E2E8F0', 
    fontSize: '13.5px', 
    cursor: 'pointer', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    transition: 'all 0.2s ease'
  }
};

export default MenuPage;