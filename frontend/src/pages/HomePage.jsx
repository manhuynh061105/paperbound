import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, cartService, categoryService } from '../services/api';
import { toast } from 'react-toastify';

const HomePage = ({ refreshCartCount, productTrigger }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKey, setSearchKey] = useState('');
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  useEffect(() => {
    setLoading(true);
    Promise.all([productService.getAll(), categoryService.getAll()])
      .then(([productRes, categoryRes]) => {
        setProducts(productRes.data.data || productRes.data || []);
        setCategories(categoryRes.data.data || categoryRes.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi nạp dữ liệu trang chủ:", err);
        setLoading(false);
      });
  }, [productTrigger]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKey.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchKey.trim())}`);
    }
  };

  const categoryIcons = ["📚", "🕵️‍♂️", "❤️", "🎨", "🚀", "🌱", "📝", "🏛️", "🧠", "💼"];

  if (loading) return <div style={styles.loadingText}>✨ Đang tải không gian sách Paperbound...</div>;

  const featuredProducts = products.slice(0, 5);
  const regularProducts = products.slice(0, 20);

  return (
    <div style={styles.pageWrapper}>
      {/* Nhúng toàn bộ mã hiệu ứng hover, nảy lướt mượt mà qua CSS Class */}
      <style>{animationStyles}</style>

      {/* SECTION 1: HERO SECTION */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Find your <span style={styles.heroTitleHighlight}>life's work.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Hệ thống nhà sách thông minh số hóa Paperbound. Kết nối những tâm hồn yêu tri thức, 
            tìm kiếm cuốn sách cuộc đời bạn một cách nhanh chóng và mượt mà nhất.
          </p>

          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <input 
              type="text" 
              placeholder="Tìm kiếm sách, tác giả, thể loại bạn quan tâm..." 
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
              style={styles.heroSearchInput}
            />
            <button type="submit" style={styles.heroSearchBtn} className="hover-button-glow">Search ➔</button>
          </form>

          <div style={styles.tagContainer}>
            {categories.slice(0, 5).map(cat => (
              <span 
                key={`tag-${cat.id}`} 
                onClick={() => navigate(`/products?category=${cat.id}`)}
                style={styles.heroTag}
                className="hover-tag"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        <div style={styles.heroImageSide}>
          <div style={styles.heroImageBadge}>PAPERBOUND 2026</div>
        </div>
      </div>

      {/* CHỨA TOÀN BỘ BỐ CỤC CĂN GIỮA (MAX-WIDTH: 1200PX) */}
      <div style={styles.mainContentLayout}>
        
        {/* SECTION 2: SẢN PHẨM NỔI BẬT */}
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeaderRed}>
            <div style={styles.sectionHeaderTitle}>🔥 SẢN PHẨM NỔI BẬT HÀNG ĐẦU</div>
            <span style={styles.countdownMock}>XU HƯỚNG MUA SẮM</span>
          </div>
          
          {featuredProducts.length === 0 ? (
            <p style={styles.emptyText}>Chưa có sách nổi bật được cập nhật.</p>
          ) : (
            <div style={styles.featuredRow}>
              {featuredProducts.map(product => (
                <div 
                  key={`featured-${product.id}`} 
                  style={styles.featuredCard} 
                  className="hover-card-bounce"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div style={styles.imgBadge}>HOT</div>
                  <img src={product.cover_image || 'https://via.placeholder.com/150x200?text=Paperbound'} alt={product.title} style={styles.featuredImage} />
                  <h4 style={styles.productTitle} title={product.title}>{product.title}</h4>
                  <p style={styles.priceText}>{Number(product.price).toLocaleString()} đ</p>
                  <div style={styles.ratingStars}>⭐ {Number(product.rating || 5).toFixed(1)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: GỢI Ý DANH MỤC SẢN PHẨM */}
        <div style={styles.sectionContainer}>
          <h3 style={styles.sectionTitleBlack}>📁 DANH MỤC SẢN PHẨM</h3>
          {categories.length === 0 ? (
            <p style={styles.emptyText}>Chưa có danh mục nào trong database.</p>
          ) : (
            <div style={styles.categoryTableGrid}>
              {categories.map((cat, index) => (
                <div 
                  key={cat.id} 
                  style={styles.categoryCell}
                  className="hover-category-cell"
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                >
                  <div style={styles.categoryAvatar} className="category-avatar-target">
                    {categoryIcons[index % categoryIcons.length]}
                  </div>
                  <div style={styles.categoryCellName}>{cat.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= CONTENT MỚI 1: WHY CHOOSE US SECTION ================= */}
        <div style={styles.sectionContainer}>
          <div style={styles.featuresBannerGrid}>
            <div style={styles.featureItem} className="hover-card-bounce">
              <span style={styles.featureIcon}>🚚</span>
              <div>
                <h4 style={styles.featureItemTitle}>Giao Hàng Siêu Tốc</h4>
                <p style={styles.featureItemDesc}>Nội hàng hỏa tốc trong 2 giờ, toàn quốc chỉ từ 2-3 ngày.</p>
              </div>
            </div>
            <div style={styles.featureItem} className="hover-card-bounce">
              <span style={styles.featureIcon}>🛡️</span>
              <div>
                <h4 style={styles.featureItemTitle}>Sách Thật 100%</h4>
                <p style={styles.featureItemDesc}>Cam kết chính bản, bọc chống sốc cẩn thận khi vận chuyển.</p>
              </div>
            </div>
            <div style={styles.featureItem} className="hover-card-bounce">
              <span style={styles.featureIcon}>🔄</span>
              <div>
                <h4 style={styles.featureItemTitle}>Đổi Trả Dễ Dàng</h4>
                <p style={styles.featureItemDesc}>Đổi trả miễn phí trong 7 ngày nếu có lỗi từ nhà sản xuất.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: GỢI Ý SẢN PHẨM */}
        <div style={styles.sectionContainer}>
          <h3 style={styles.sectionTitleBlack}>✨ GỢI Ý DÀNH CHO BẠN</h3>
          
          {regularProducts.length === 0 ? (
            <div style={styles.emptyBlock}>
              <p>Hiện chưa có sản phẩm nào trong hệ thống.</p>
            </div>
          ) : (
            <div>
              <div style={styles.productGrid}>
                {regularProducts.map(product => (
                  <div 
                    key={`regular-${product.id}`} 
                    style={styles.productCard} 
                    className="hover-card-bounce"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <img 
                      src={product.cover_image || 'https://via.placeholder.com/150x200?text=No+Cover'} 
                      alt={product.title} 
                      style={styles.gridImage}
                    />
                    <div style={styles.cardBody}>
                      <h3 style={styles.productTitle} title={product.title}>
                        {product.title}
                      </h3>
                      <p style={styles.authorText}>✍️ {product.author || 'Chưa rõ'}</p>
                      <div style={styles.rowFlex}>
                        <span style={styles.gridPrice}>{Number(product.price).toLocaleString()} đ</span>
                        <span style={styles.gridRating}>⭐ {Number(product.rating || 5).toFixed(1)}</span>
                      </div>
                      <button 
                        onClick={(e) => handleAddToCart(e, product)} 
                        style={styles.addToCartBtn}
                        className="hover-cart-btn"
                      >
                        🛒 Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.centerActionBlock}>
                <button 
                  onClick={() => navigate('/products')} 
                  style={styles.viewAllBtn}
                  className="hover-viewall-btn"
                >
                  Xem Tất Cả Sản Phẩm Cửa Hàng ➔
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= CONTENT MỚI 2: TESTIMONIAL SECTION ================= */}
        <div style={{...styles.sectionContainer, marginBottom: '60px'}}>
          <h3 style={styles.sectionTitleBlack}>💬 ĐỘC GIẢ NÓI VỀ PAPERBOUND</h3>
          <div style={styles.testimonialGrid}>
            <div style={styles.testimonialCard}>
              <p style={styles.testimonialText}>"Sách đóng gói siêu kỹ, giao nhanh khủng khiếp. Hệ thống tìm kiếm của Paperbound thông minh cực kỳ, bấm cái ra đúng cuốn mình cần tìm bấy lâu."</p>
              <h5 style={styles.testimonialAuthor}>– Hoàng Nam (Hà Nội)</h5>
            </div>
            <div style={styles.testimonialCard}>
              <p style={styles.testimonialText}>"Giao diện tối giản, hiện đại và rất mượt. Thao tác thêm vào giỏ hàng và đặt sách nhanh chóng, chăm sóc khách hàng nhiệt tình hỗ trợ nhiệt tình."</p>
              <h5 style={styles.testimonialAuthor}>– Khánh Linh (Đà Nẵng)</h5>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==================== KHỐI HOVER ANIMATIONS NÂNG CẤP VỚI LỚP GIẢ (PSEUDO-CLASSES) ====================
const animationStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(25px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlow {
    0% { border-color: rgba(230,126,34,0.4); box-shadow: 0 0 5px rgba(230,126,34,0.2); }
    50% { border-color: rgba(218,253,24,1); box-shadow: 0 0 15px rgba(218,253,24,0.4); }
    100% { border-color: rgba(230,126,34,0.4); box-shadow: 0 0 5px rgba(230,126,34,0.2); }
  }
  
  /* Hiệu ứng nảy lướt mượt mà kèm shadow cho Thẻ Sản Phẩm */
  .hover-card-bounce {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  }
  .hover-card-bounce:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12) !important;
    border-color: #F14D5C !important;
  }

  /* Nút tìm kiếm lớn trên Hero section */
  .hover-button-glow {
    transition: all 0.2s ease !important;
  }
  .hover-button-glow:hover {
    background-color: #ffffff !important;
    color: #F14D5C !important;
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(218,253,24,0.4);
  }

  /* Hovers các tags gợi ý */
  .hover-tag {
    transition: all 0.2s ease !important;
  }
  .hover-tag:hover {
    color: #dafd18 !important;
    border-color: #dafd18 !important;
    background-color: rgba(218,253,24,0.05) !important;
  }

  /* Hiệu ứng phóng to quả cầu icon trong danh mục */
  .hover-category-cell {
    transition: all 0.25s ease !important;
  }
  .hover-category-cell:hover {
    background-color: #FFF2F3 !important;
    border-color: #FBCBCF !important;
    transform: translateY(-3px);
  }
  .hover-category-cell:hover .category-avatar-target {
    transform: scale(1.15) rotate(5deg);
    background-color: #ffffff !important;
  }
  .category-avatar-target {
    transition: transform 0.25s ease !important;
  }

  /* Hiệu ứng nút thêm vào giỏ hàng */
  .hover-cart-btn {
    transition: all 0.2s ease !important;
  }
  .hover-cart-btn:hover {
    background-color: #F14D5C !important;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 10px rgba(241,77,92,0.3);
  }

  /* Nút Xem tất cả ở dưới */
  .hover-viewall-btn {
    transition: all 0.25s ease !important;
  }
  .hover-viewall-btn:hover {
    background-color: #2C3E50 !important;
    color: #ffffff !important;
    box-shadow: 0 5px 15px rgba(44,62,80,0.2);
  }
`;

const styles = {
  pageWrapper: { backgroundColor: '#f8f9fa', minHeight: '100vh', width: '100%' },
  loadingText: { padding: '100px', textAlign: 'center', fontSize: '18px', color: '#555', fontWeight: 'bold' },

  heroSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d', 
    padding: '60px 40px',
    borderRadius: '16px',
    margin: '0 auto 40px auto',
    maxWidth: '1200px', 
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    animation: 'fadeInUp 0.8s ease-out'
  },
  heroContent: { flex: 1, zIndex: 2, maxWidth: '650px' },
  heroTitle: { fontSize: '48px', fontWeight: '800', color: '#ffffff', margin: '0 0 15px 0', fontFamily: 'system-ui' },
  heroTitleHighlight: { 
    color: '#dafd18', 
    border: '2px solid #dafd18', 
    padding: '2px 12px', 
    borderRadius: '30px',
    display: 'inline-block',
    animation: 'pulseGlow 3s infinite ease-in-out'
  },
  heroSubtitle: { fontSize: '16px', color: '#a0aec0', lineHeight: '1.6', margin: '0 0 30px 0' },
  
  searchForm: { display: 'flex', backgroundColor: '#ffffff', borderRadius: '30px', padding: '6px 8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', marginBottom: '20px' },
  heroSearchInput: { flex: 1, border: 'none', outline: 'none', padding: '12px 20px', fontSize: '15px', borderRadius: '30px', color: '#333' },
  heroSearchBtn: { backgroundColor: '#dafd18', color: '#0a0f1d', border: 'none', padding: '12px 26px', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  
  tagContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  heroTag: { border: '1px solid #4a5568', color: '#cbd5e0', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)' },
  
  heroImageSide: {
    flex: 0.8, height: '320px', 
    backgroundImage: 'url("https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000")', 
    backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px', opacity: 0.7,
    display: 'flex', alignItems: 'flex-end', padding: '20px', boxSizing: 'border-box', marginLeft: '40px'
  },
  heroImageBadge: { backgroundColor: '#ffffff', color: '#0a0f1d', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' },

  mainContentLayout: { maxWidth: '1200px', margin: '0 auto', padding: '0 15px', boxSizing: 'border-box' },
  sectionContainer: { marginBottom: '50px' },
  sectionTitleBlack: { fontSize: '20px', color: '#2C3E50', fontWeight: 'bold', margin: '0 0 25px 0', paddingLeft: '10px', borderLeft: '4px solid #F14D5C' },
  emptyText: { padding: '20px', color: '#7f8c8d', fontStyle: 'italic' },
  emptyBlock: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },

  sectionHeaderRed: { backgroundColor: '#F14D5C', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderRadius: '8px 8px 0 0', color: 'white' },
  sectionHeaderTitle: { fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' },
  countdownMock: { backgroundColor: '#fff', color: '#F14D5C', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' },
  
  featuredRow: { display: 'flex', gap: '15px', backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 8px 8px', overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  featuredCard: { flex: '0 0 185px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', border: '1px solid #f0f0f0', padding: '12px', borderRadius: '6px', position: 'relative', backgroundColor: '#fff' },
  imgBadge: { position: 'absolute', top: '8px', left: '8px', backgroundColor: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px' },
  featuredImage: { width: '130px', height: '175px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  priceText: { color: '#C0392B', fontWeight: 'bold', fontSize: '15px', margin: '5px 0' },
  ratingStars: { fontSize: '12px', color: '#f1c40f', fontWeight: 'bold' },

  categoryTableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '15px', backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
  categoryCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px 10px', border: '1px solid #f1f2f6', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#fff' },
  categoryAvatar: { width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#FFF2F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px', border: '1px solid #FBCBCF' },
  categoryCellName: { fontSize: '13px', fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: '1.3' },

  // LƯỚI TÍNH NĂNG MỚI (WHY CHOOSE US)
  featuresBannerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  featureItem: { display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #eef0f2', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
  featureIcon: { fontSize: '32px' },
  featureItemTitle: { margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#2C3E50' },
  featureItemDesc: { margin: 0, fontSize: '13px', color: '#7f8c8d', lineHeight: '1.4' },

  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '20px' },
  productCard: { backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #eef0f2', cursor: 'pointer' },
  gridImage: { width: '100%', height: '245px', objectFit: 'cover' },
  cardBody: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' },
  productTitle: { margin: '0', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '38px', color: '#2C3E50' },
  authorText: { fontSize: '12px', color: '#7f8c8d', margin: 0 },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gridPrice: { color: '#E67E22', fontWeight: 'bold', fontSize: '15px' },
  gridRating: { fontSize: '12px', color: '#f1c40f', fontWeight: 'bold' },
  addToCartBtn: { backgroundColor: '#2C3E50', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', marginTop: '5px' },

  centerActionBlock: { textAlign: 'center', marginTop: '40px' },
  viewAllBtn: { backgroundColor: '#fff', color: '#2C3E50', border: '2px solid #2C3E50', padding: '12px 40px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

  // LƯỚI ĐÁNH GIÁ MỚI (TESTIMONIALS)
  testimonialGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' },
  testimonialCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #eef0f2', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', fontStyle: 'italic', position: 'relative' },
  testimonialText: { margin: '0 0 15px 0', fontSize: '14px', color: '#555', lineHeight: '1.6' },
  testimonialAuthor: { margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#F14D5C', textAlign: 'right', notStyle: 'normal' }
};

export default HomePage;