import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, cartService, categoryService } from '../services/api';
import { toast } from 'react-toastify';

const HomePage = ({ refreshCartCount, productTrigger }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKey, setSearchKey] = useState('');
  const [backgroundElements, setBackgroundElements] = useState([]);
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  useEffect(() => {
    const elements = Array.from({ length: 25 }).map((_, i) => {
      const isStar = Math.random() > 0.5;
      return {
        id: i,
        type: isStar ? 'star' : 'dust',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: isStar ? `${Math.random() * 3 + 2}px` : `${Math.random() * 6 + 4}px`,
        delay: `${Math.random() * 6}s`,
        duration: isStar ? `${Math.random() * 3 + 2}s` : `${Math.random() * 8 + 6}s`,
      };
    });
    setBackgroundElements(elements);
  }, []);

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
      <style>{animationStyles}</style>

      <div style={styles.heroSection}>
        
        <div style={styles.animatedBgContainer}>
          {backgroundElements.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.left,
                top: el.top,
                width: el.size,
                height: el.size,
                borderRadius: '50%',
                backgroundColor: el.type === 'star' ? '#FFF' : 'rgba(230, 126, 34, 0.4)',
                boxShadow: el.type === 'star' ? '0 0 10px #FFF' : '0 0 8px rgba(230, 126, 34, 0.6)',
                animation: el.type === 'star' 
                  ? `twinkle ${el.duration} infinite ease-in-out ${el.delay}`
                  : `floatDown ${el.duration} infinite linear ${el.delay}`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>

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

      <div style={styles.mainContentLayout}>
        
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeaderOrange}>
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
                    <div style={styles.imageContainer}>
                      <img 
                        src={product.cover_image || 'https://via.placeholder.com/150x200?text=No+Cover'} 
                        alt={product.title} 
                        style={styles.gridImage}
                      />
                    </div>
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

        <div style={{...styles.sectionContainer, marginBottom: '80px'}}>
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


const animationStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlow {
    0% { border-color: rgba(230,126,34,0.4); box-shadow: 0 0 5px rgba(230,126,34,0.2); }
    50% { border-color: rgba(230,126,34,1); box-shadow: 0 0 20px rgba(230,126,34,0.5); }
    100% { border-color: rgba(230,126,34,0.4); box-shadow: 0 0 5px rgba(230,126,34,0.2); }
  }
  
  /* 🌟 Hiệu ứng lấp lánh nhẹ nhàng cho Sao */
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  /* 🌟 Hiệu ứng bụi giấy rơi lãng mạn nhẹ nhàng từ trên xuống */
  @keyframes floatDown {
    0% {
      transform: translateY(-20px) translateX(0) rotate(0deg);
      opacity: 0;
    }
    10% { opacity: 0.6; }
    90% { opacity: 0.6; }
    100% {
      transform: translateY(360px) translateX(30px) rotate(360deg);
      opacity: 0;
    }
  }

  .hover-card-bounce {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .hover-card-bounce:hover {
    transform: translateY(-6px) !important;
    box-shadow: 0 12px 28px rgba(44, 62, 80, 0.12) !important;
    border-color: #E67E22 !important;
  }

  .hover-button-glow {
    transition: all 0.25s ease !important;
  }
  .hover-button-glow:hover {
    background-color: #ffffff !important;
    color: #E67E22 !important;
    transform: scale(1.03);
    box-shadow: 0 6px 20px rgba(230,126,34,0.4);
  }

  .hover-tag {
    transition: all 0.2s ease !important;
  }
  .hover-tag:hover {
    color: #E67E22 !important;
    border-color: #E67E22 !important;
    background-color: rgba(230,126,34,0.08) !important;
  }

  .hover-category-cell {
    transition: all 0.25s ease !important;
  }
  .hover-category-cell:hover {
    background-color: #FFFDFB !important;
    border-color: #FADBD8 !important;
    transform: translateY(-3px);
  }
  .hover-category-cell:hover .category-avatar-target {
    transform: scale(1.1) rotate(4deg);
    background-color: #ffffff !important;
    box-shadow: 0 4px 10px rgba(230,126,34,0.15);
  }
  .category-avatar-target {
    transition: transform 0.25s ease, background-color 0.25s ease !important;
  }

  .hover-cart-btn {
    transition: all 0.25s ease !important;
  }
  .hover-cart-btn:hover {
    background-color: #D35400 !important;
    box-shadow: 0 4px 12px rgba(230,126,34,0.3);
  }

  .hover-viewall-btn {
    transition: all 0.25s ease !important;
  }
  .hover-viewall-btn:hover {
    background-color: #2C3E50 !important;
    color: #ffffff !important;
    box-shadow: 0 6px 20px rgba(44,62,80,0.15);
  }
`;

const styles = {
  pageWrapper: { backgroundColor: '#FAFAFA', minHeight: '100vh', width: '100%', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  loadingText: { padding: '120px', textAlign: 'center', fontSize: '16px', color: '#64748B', fontWeight: '500' },

  heroSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C3E50', 
    padding: '70px 50px',
    borderRadius: '20px',
    margin: '30px auto 50px auto',
    maxWidth: '1200px', 
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 20px 40px rgba(44,62,80,0.15)'
  },
  
  
  animatedBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none', 
    zIndex: 1
  },

  heroContent: { flex: 1.2, zIndex: 2, maxWidth: '680px' },
  heroTitle: { fontSize: '52px', fontWeight: '800', color: '#ffffff', margin: '0 0 20px 0', letterSpacing: '-0.5px', lineHeight: '1.1' },
  heroTitleHighlight: { 
    color: '#E67E22', 
    border: '2px solid #E67E22', 
    padding: '2px 16px', 
    borderRadius: '30px',
    display: 'inline-block',
    animation: 'pulseGlow 3s infinite ease-in-out'
  },
  heroSubtitle: { fontSize: '16px', color: '#E2E8F0', lineHeight: '1.65', margin: '0 0 35px 0', opacity: 0.9 },
  
  searchForm: { display: 'flex', backgroundColor: '#ffffff', borderRadius: '30px', padding: '6px 8px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', marginBottom: '24px' },
  heroSearchInput: { flex: 1, border: 'none', outline: 'none', padding: '12px 24px', fontSize: '15px', borderRadius: '30px', color: '#1E293B' },
  heroSearchBtn: { backgroundColor: '#E67E22', color: '#ffffff', border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  
  tagContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  heroTag: { border: '1px solid rgba(255,255,255,0.2)', color: '#F1F5F9', padding: '6px 18px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.06)' },
  
  heroImageSide: {
    flex: 0.8, height: '340px', 
    backgroundImage: 'url("https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000")', 
    backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px',
    display: 'flex', alignItems: 'flex-end', padding: '20px', boxSizing: 'border-box', marginLeft: '50px',
    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)',
    zIndex: 2 
  },
  heroImageBadge: { backgroundColor: '#ffffff', color: '#2C3E50', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', letterSpacing: '1px' },

  mainContentLayout: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' },
  sectionContainer: { marginBottom: '55px' },
  sectionTitleBlack: { fontSize: '22px', color: '#2C3E50', fontWeight: '800', margin: '0 0 28px 0', paddingLeft: '12px', borderLeft: '4px solid #E67E22', letterSpacing: '0.3px' },
  emptyText: { padding: '20px', color: '#64748B', fontStyle: 'italic', fontSize: '14.5px' },
  emptyBlock: { backgroundColor: '#fff', padding: '50px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' },

  sectionHeaderOrange: { backgroundColor: '#2C3E50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderRadius: '12px 12px 0 0', color: 'white', borderBottom: '3px solid #E67E22' },
  sectionHeaderTitle: { fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px' },
  countdownMock: { backgroundColor: '#E67E22', color: '#ffffff', padding: '5px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px' },
  
  featuredRow: { display: 'flex', gap: '20px', backgroundColor: '#fff', padding: '24px', borderRadius: '0 0 12px 12px', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', borderTop: 'none' },
  featuredCard: { flex: '0 0 185px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', border: '1px solid #F1F5F9', padding: '14px', borderRadius: '10px', position: 'relative', backgroundColor: '#fff' },
  imgBadge: { position: 'absolute', top: '10px', left: '10px', backgroundColor: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px', zIndex: 2 },
  featuredImage: { width: '135px', height: '185px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' },
  priceText: { color: '#E67E22', fontWeight: '700', fontSize: '15.5px', margin: '6px 0 4px 0' },
  ratingStars: { fontSize: '12px', color: '#F59E0B', fontWeight: '700' },

  categoryTableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', backgroundColor: '#fff', padding: '28px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' },
  categoryCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 12px', border: '1px solid #F1F5F9', borderRadius: '10px', cursor: 'pointer', backgroundColor: '#fff' },
  categoryAvatar: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '12px', border: '1px solid #FFEDD5' },
  categoryCellName: { fontSize: '13.5px', fontWeight: '700', color: '#334155', textAlign: 'center', lineHeight: '1.3' },

  featuresBannerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' },
  featureItem: { display: 'flex', gap: '18px', alignItems: 'center', backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' },
  featureIcon: { fontSize: '34px' },
  featureItemTitle: { margin: '0 0 6px 0', fontSize: '15.5px', fontWeight: '700', color: '#2C3E50' },
  featureItemDesc: { margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.45' },

  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' },
  productCard: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', cursor: 'pointer' },
  imageContainer: { width: '100%', height: '255px', overflow: 'hidden', backgroundColor: '#F8FAFC' },
  gridImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' },
  cardBody: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' },
  productTitle: { margin: '0', fontSize: '14.5px', fontWeight: '700', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', color: '#2C3E50' },
  authorText: { fontSize: '12.5px', color: '#64748B', margin: 0 },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gridPrice: { color: '#E67E22', fontWeight: '700', fontSize: '16px' },
  gridRating: { fontSize: '12.5px', color: '#F59E0B', fontWeight: '700' },
  addToCartBtn: { backgroundColor: '#2C3E50', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', width: '100%', marginTop: '6px', letterSpacing: '0.3px' },

  centerActionBlock: { textAlign: 'center', marginTop: '45px' },
  viewAllBtn: { backgroundColor: '#fff', color: '#2C3E50', border: '2px solid #2C3E50', padding: '14px 45px', borderRadius: '8px', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer' },

  testimonialGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' },
  testimonialCard: { backgroundColor: '#fff', padding: '28px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.01)', fontStyle: 'italic', position: 'relative' },
  testimonialText: { margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' },
  testimonialAuthor: { margin: 0, fontSize: '13px', fontWeight: '700', color: '#E67E22', textAlign: 'right', fontStyle: 'normal', letterSpacing: '0.3px' }
};

export default HomePage;