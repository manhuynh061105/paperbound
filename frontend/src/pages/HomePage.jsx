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
    e.stopPropagation(); // Ngăn sự kiện click thẻ card chuyển hướng sang trang chi tiết
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
      {/* Thêm nhãn CSS Animation trực tiếp vào DOM */}
      <style>{animationStyles}</style>

      {/* SECTION 1: HERO SECTION GIỚI THIỆU PHONG CÁCH PARALLEL HIỆN ĐẠI & SIÊU MƯỢT */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Find your <span style={styles.heroTitleHighlight}>life's work.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Hệ thống nhà sách thông minh số hóa Paperbound. Kết nối những tâm hồn yêu tri thức, 
            tìm kiếm cuốn sách cuộc đời bạn một cách nhanh chóng và mượt mà nhất.
          </p>

          {/* Thanh tìm kiếm trung tâm lớn giống hệt ảnh thứ 2 */}
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <input 
              type="text" 
              placeholder="Tìm kiếm sách, tác giả, thể loại bạn quan tâm..." 
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
              style={styles.heroSearchInput}
            />
            <button type="submit" style={styles.heroSearchBtn}>Search ➔</button>
          </form>

          {/* Các nhãn thể loại gợi ý nhanh */}
          <div style={styles.tagContainer}>
            {categories.slice(0, 5).map(cat => (
              <span 
                key={`tag-${cat.id}`} 
                onClick={() => navigate(`/products?category=${cat.id}`)}
                style={styles.heroTag}
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Khối ảnh nền mờ ảo chuyển động chậm phía sau bên phải */}
        <div style={styles.heroImageSide}>
          <div style={styles.heroImageBadge}>PAPERBOUND 2026</div>
        </div>
      </div>

      {/* CHỨA TOÀN BỘ BỐ CỤC CĂN GIỮA CHUẨN FAHASA (MAX-WIDTH: 1200PX) */}
      <div style={styles.mainContentLayout}>
        
        {/* SECTION 2: SẢN PHẨM NỔI BẬT (THANH ĐỎ RỰC RỠ TRỰC QUAN) */}
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
                <div key={`featured-${product.id}`} style={styles.featuredCard} onClick={() => navigate(`/products/${product.id}`)}>
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
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                >
                  <div style={styles.categoryAvatar}>
                    {categoryIcons[index % categoryIcons.length]}
                  </div>
                  <div style={styles.categoryCellName}>{cat.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: GỢI Ý SẢN PHẨM (20 SẢN PHẨM ĐẦU TIÊN) */}
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
                  <div key={`regular-${product.id}`} style={styles.productCard} onClick={() => navigate(`/products/${product.id}`)}>
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
                      <button onClick={(e) => handleAddToCart(e, product)} style={styles.addToCartBtn}>
                        🛒 Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* NÚT XEM TẤT CẢ REDIRECT SANG MENU */}
              <div style={styles.centerActionBlock}>
                <button onClick={() => navigate('/products')} style={styles.viewAllBtn}>
                  Xem Tất Cả Sản Phẩm Cửa Hàng ➔
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ĐỊNH NGHĨA KEYFRAMES CSS CHO HIỆU ỨNG MƯỢT MÀ NHƯ TRANH THỨ 2
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
  .animate-hero {
    animation: fadeInUp 0.9s cubic-bezier(0.25, 1, 0.5, 1) both;
  }
`;

const styles = {
  pageWrapper: { backgroundColor: '#f8f9fa', minHeight: '100vh', width: '100%' },
  loadingText: { padding: '100px', textAlign: 'center', fontSize: '18px', color: '#555', fontWeight: 'bold' },

  // ==================== CẤU TRÚC HERO SECTION (ẢNH THỨ 2 - PARALLEL STYLE) ====================
  heroSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d', // Tông tối sâu huyền bí hiện đại
    padding: '60px 40px',
    borderRadius: '16px',
    margin: '0 auto 40px auto',
    maxWidth: '1200px', // Khớp độ rộng căn giữa với danh sách dưới
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    animation: 'fadeInUp 0.8s ease-out'
  },
  heroContent: { flex: 1, zIndex: 2, maxWidth: '650px' },
  heroTitle: { fontSize: '48px', fontWeight: '800', color: '#ffffff', margin: '0 0 15px 0', fontFamily: 'system-ui' },
  heroTitleHighlight: { 
    color: '#dafd18', // Màu vàng chanh neon rực rỡ chuẩn phong cách ảnh 2
    border: '2px solid #dafd18', 
    padding: '2px 12px', 
    borderRadius: '30px',
    display: 'inline-block',
    animation: 'pulseGlow 3s infinite ease-in-out'
  },
  heroSubtitle: { fontSize: '16px', color: '#a0aec0', lineHeight: '1.6', margin: '0 0 30px 0' },
  
  // Thanh tìm kiếm lớn tinh tế
  searchForm: { display: 'flex', backgroundColor: '#ffffff', borderRadius: '30px', padding: '6px 8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', marginBottom: '20px' },
  heroSearchInput: { flex: 1, border: 'none', outline: 'none', padding: '12px 20px', fontSize: '15px', borderRadius: '30px', color: '#333' },
  heroSearchBtn: { backgroundColor: '#dafd18', color: '#0a0f1d', border: 'none', padding: '12px 26px', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' },
  
  // Tags thể loại
  tagContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  heroTag: { border: '1px solid #4a5568', color: '#cbd5e0', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', transition: 'all 0.2s' },
  
  // Khối ảnh trang trí mờ bên phải
  heroImageSide: {
    flex: 0.8, height: '320px', 
    backgroundImage: 'url("https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000")', 
    backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px', opacity: 0.7,
    display: 'flex', alignItems: 'flex-end', padding: '20px', boxSizing: 'border-box', marginLeft: '40px'
  },
  heroImageBadge: { backgroundColor: '#ffffff', color: '#0a0f1d', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' },

  // ==================== KHU VỰC CĂN GIỮA CHUẨN FAHASA (MAX-WIDTH: 1200PX) ====================
  mainContentLayout: { maxWidth: '1200px', margin: '0 auto', padding: '0 15px', boxSizing: 'border-box' },
  sectionContainer: { marginBottom: '40px' },
  sectionTitleBlack: { fontSize: '20px', color: '#2C3E50', fontWeight: 'bold', margin: '0 0 20px 0', paddingLeft: '10px', borderLeft: '4px solid #F14D5C' },
  emptyText: { padding: '20px', color: '#7f8c8d', fontStyle: 'italic' },
  emptyBlock: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },

  // Khối Header đỏ rực rỡ thu hút chuẩn ảnh Fahasa
  sectionHeaderRed: { backgroundColor: '#F14D5C', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderRadius: '8px 8px 0 0', color: 'white' },
  sectionHeaderTitle: { fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' },
  countdownMock: { backgroundColor: '#fff', color: '#F14D5C', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' },
  
  // Hàng sản phẩm nổi bật nằm ngang
  featuredRow: { display: 'flex', gap: '15px', backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 8px 8px', overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  featuredCard: { flex: '0 0 185px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', border: '1px solid #f0f0f0', padding: '12px', borderRadius: '6px', position: 'relative', backgroundColor: '#fff', transition: 'transform 0.2s' },
  imgBadge: { position: 'absolute', top: '8px', left: '8px', backgroundColor: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px' },
  featuredImage: { width: '130px', height: '175px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  priceText: { color: '#C0392B', fontWeight: 'bold', fontSize: '15px', margin: '5px 0' },
  ratingStars: { fontSize: '12px', color: '#f1c40f', fontWeight: 'bold' },

  // Lưới danh mục ô vuông ngay ngắn
  categoryTableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '15px', backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
  categoryCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px 10px', border: '1px solid #f1f2f6', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#fff' },
  categoryAvatar: { width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#FFF2F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px', border: '1px solid #FBCBCF' },
  categoryCellName: { fontSize: '13px', fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: '1.3' },

  // Lưới sản phẩm gợi ý xu hướng ở dưới cùng
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '20px' },
  productCard: { backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #eef0f2', cursor: 'pointer', transition: 'transform 0.2s' },
  gridImage: { width: '100%', height: '245px', objectFit: 'cover' },
  cardBody: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' },
  authorText: { fontSize: '12px', color: '#7f8c8d', margin: 0 },
  rowFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gridPrice: { color: '#E67E22', fontWeight: 'bold', fontSize: '15px' },
  gridRating: { fontSize: '12px', color: '#f1c40f', fontWeight: 'bold' },
  addToCartBtn: { backgroundColor: '#2C3E50', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', marginTop: '5px' },

  // Nút xem tất cả
  centerActionBlock: { textAlign: 'center', marginTop: '40px' },
  viewAllBtn: { backgroundColor: '#fff', color: '#2C3E50', border: '2px solid #2C3E50', padding: '12px 40px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }
};

export default HomePage;