import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, cartService, reviewService } from '../services/api';
import { toast } from 'react-toastify';

const ProductDetailPage = ({ onAddToCart, refreshCartCount, currentUser }) => { 
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]); 
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  useEffect(() => {
    window.scrollTo(0, 0); 
    setLoading(true);

    Promise.all([
      productService.getById(id).catch(err => {
        console.error(err);
        return null;
      }),
      productService.getRelated(id).catch(err => {
        console.error(err);
        return { data: { data: [] } };
      }),
      reviewService.getByProductId(id).catch(err => {
        console.error(err);
        return { data: { data: [] } };
      })
    ])
    .then(([resProd, resRelated, resReviews]) => {
      if (!resProd) {
        toast.error("❌ Không thể kết nối đến máy chủ để lấy thông tin sách!");
        setLoading(false);
        return;
      }

      const rawData = resProd?.data?.data || resProd?.data;
      const finalProduct = Array.isArray(rawData) ? rawData[0] : rawData;

      if (!finalProduct || Object.keys(finalProduct).length === 0) {
        toast.error("❌ Không tìm thấy thông tin cuốn sách này!");
        navigate('/');
        return;
      }

      setProduct({
        ...finalProduct,
        price: finalProduct.price || 0,
        tax_rate: finalProduct.tax_rate || 5,
        rating: finalProduct.rating || 5.0,
        stock_quantity: finalProduct.stock_quantity !== undefined ? finalProduct.stock_quantity : 10
      });

      const relatedData = resRelated?.data?.data || resRelated?.data || [];
      setRelatedProducts(Array.isArray(relatedData) ? relatedData : []);

      const reviewsData = resReviews?.data?.data || resReviews?.data || [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    })
    .catch(err => {
      console.error(err);
      toast.error("❌ Có lỗi xảy ra khi tải dữ liệu trang!");
    })
    .finally(() => setLoading(false));
    
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748B', fontWeight: '500' }}>Đang tải thông tin sách thực tế...</p>
      </div>
    );
  }

  if (!product) return null;

  const handleQuantityChange = (val) => {
    if (val < 1) return;
    if (val > product.stock_quantity) {
      toast.warning(`⚠️ Chỉ còn ${product.stock_quantity} cuốn trong kho!`);
      return;
    }
    setQuantity(val);
  };

  const handleBuyClick = async () => {
    if (!userId) {
      toast.info("👤 Vui lòng đăng nhập để thực hiện mua sắm!");
      navigate('/auth');
      return;
    }

    if (product.stock_quantity <= 0) {
      toast.error("❌ Sản phẩm hiện đã hết hàng!");
      return;
    }

    try {
      const payload = {
        userId: Number(userId),
        productId: Number(product.id),
        quantity: Number(quantity)
      };

      await cartService.add(payload); 
      
      toast.success(`🛒 Đã thêm ${quantity} cuốn "${product.title}" vào giỏ hàng thành công!`);
      
      if (refreshCartCount) {
        refreshCartCount();
      }

    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm vào giỏ hàng: " + (error.response?.data?.message || error.message));
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floorRating = Math.floor(rating || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= floorRating ? '#E67E22' : '#E2E8F0', fontSize: '16px', marginRight: '2px' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div style={styles.container}>
      <style>{animationStyles}</style>
      <div style={styles.layoutGrid}>
        
        <div style={styles.leftColumn}>
          
          <div style={styles.mainCard}>
            <div style={styles.imageWrapper}>
              <img 
                src={product.cover_image || 'https://via.placeholder.com/300x420?text=Paperbound'} 
                alt={product.title} 
                style={styles.mainImg} 
                className="product-zoom"
              />
            </div>
            
            <div style={styles.infoWrapper}>
              <h1 style={styles.bookTitle}>{product.title}</h1>
              
              <div style={styles.metaRow}>
                <p style={styles.metaText}>Tác giả: <span style={styles.metaValue}>{product.author || 'Chưa rõ'}</span></p>
                <span style={styles.bulletSeparator}>•</span>
                <p style={styles.metaText}>Định dạng: <span style={styles.metaValue}>Bìa mềm</span></p>
              </div>

              <div style={styles.ratingBadgeRow}>
                <div style={styles.starsBox}>{renderStars(product.rating)}</div>
                <span style={styles.ratingText}>{Number(product.rating).toFixed(1)}</span>
                <span style={styles.pipe}>|</span>
                <span style={styles.soldText}>Kho hàng: {product.stock_quantity > 0 ? `${product.stock_quantity} cuốn` : 'Hết hàng'}</span>
              </div>

              <div style={styles.priceCard}>
                <div style={styles.priceSubRow}>
                  <span style={styles.mainPrice}>{Number(product.price).toLocaleString('vi-VN')} đ</span>
                  <span style={styles.taxBadge}>VAT {product.tax_rate}%</span>
                </div>
                <p style={styles.priceNotice}>* Giá bán đã bao gồm thuế áp dụng quy định</p>
              </div>

              <div style={styles.purchaseSection}>
                <span style={styles.qtyLabel}>Số lượng</span>
                <div style={styles.qtyContainer}>
                  <button onClick={() => handleQuantityChange(quantity - 1)} style={styles.qtyBtn} className="hover-qty-btn">-</button>
                  <input type="text" value={quantity} readOnly style={styles.qtyInput} />
                  <button onClick={() => handleQuantityChange(quantity + 1)} style={styles.qtyBtn} className="hover-qty-btn">+</button>
                </div>
              </div>

              <div style={styles.btnRow}>
                <button 
                  onClick={handleBuyClick} 
                  style={{...styles.cartBtn, opacity: product.stock_quantity <= 0 ? 0.6 : 1}}
                  disabled={product.stock_quantity <= 0}
                  className="hover-action-btn"
                >
                  {product.stock_quantity > 0 ? '🛒 THÊM VÀO GIỎ HÀNG' : '❌ HẾT HÀNG TẠM THỜI'}
                </button>
              </div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <h3 style={styles.sectionHeader}>📝 Tóm tắt nội dung tác phẩm</h3>
            <p style={styles.description}>
              {product.description || "Cuốn sách này hiện chưa có bài tóm tắt nội dung chi tiết từ nhà phát hành. Hệ thống sẽ sớm tự động cập nhật bài giới thiệu trong thời gian tới."}
            </p>
          </div>

          <div style={styles.sectionCard}>
            <h3 style={styles.sectionHeader}>💬 Đánh giá từ cộng đồng độc giả ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>✍️</div>
                <p style={styles.emptyTitle}>Chưa có lượt đánh giá nào</p>
                <p style={styles.emptyDesc}>Hãy là người đầu tiên sở hữu cuốn sách này và chia sẻ cảm nhận của bạn với cộng đồng nhé!</p>
              </div>
            ) : (
              <div style={styles.reviewsList}>
                {reviews.map(rev => (
                  <div key={rev.id} style={styles.reviewItem}>
                    
                    <div style={styles.reviewMeta}>
                      <span style={styles.reviewUser}>
                        👤 {rev.username || rev.user_name || "Độc giả ẩn danh"}
                      </span>
                      <span style={styles.reviewDate}>
                        📅 {rev.created_at ? new Date(rev.created_at).toLocaleDateString('vi-VN') : "Vừa xong"}
                      </span>
                    </div>
                    
                    <div style={{ margin: '6px 0' }}>{renderStars(rev.rating)}</div>
                    
                    <p style={styles.reviewComment}>{rev.comment}</p>
                    
                    {rev.review_image && (
                      <div style={{ marginTop: '12px' }}>
                        <img 
                          src={rev.review_image} 
                          alt="Ảnh thực tế sản phẩm" 
                          style={styles.reviewImgThumb}
                          onClick={() => window.open(rev.review_image, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div style={styles.rightColumn}>
          
          <div style={styles.sideCard}>
            <h4 style={styles.sideTitle}>📋 Thông tin chi tiết</h4>
            <table style={styles.specTable}>
              <tbody>
                <tr>
                  <td style={styles.tdLabel}>Nhà xuất bản</td>
                  <td style={styles.tdValue}>NXB Văn Học</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Kích thước</td>
                  <td style={styles.tdValue}>13 x 20.5 cm</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Số trang</td>
                  <td style={styles.tdValue}>342 trang</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Trạng thái</td>
                  <td style={{...styles.tdValue, color: product.stock_quantity > 0 ? '#2ECC71' : '#EF4444', fontWeight: '700'}}>
                    {product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={styles.sideCard}>
            <h4 style={styles.sideTitle}>📚 Tác phẩm cùng thể loại</h4>
            {relatedProducts.length === 0 ? (
              <div style={styles.emptyMiniContainer}>
                <p style={styles.emptyMiniText}>Chưa có đầu sách liên quan nào khác thuộc danh mục này.</p>
              </div>
            ) : (
              <div style={styles.relatedList}>
                {relatedProducts.map(item => (
                  <div key={item.id} style={styles.relatedRowItem} className="hover-related-item" onClick={() => navigate(`/products/${item.id}`)}>
                    <img src={item.cover_image || 'https://via.placeholder.com/80x110?text=Book'} alt={item.title} style={styles.relatedMiniImg} />
                    <div style={styles.relatedMiniInfo}>
                      <h5 style={styles.relatedMiniTitle}>{item.title}</h5>
                      <span style={styles.relatedMiniPrice}>{Number(item.price).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

const animationStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .product-zoom {
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .product-zoom:hover {
    transform: scale(1.03);
  }
  .hover-action-btn {
    transition: all 0.25s ease !important;
  }
  .hover-action-btn:hover {
    background-color: #D35400 !important;
    box-shadow: 0 10px 25px rgba(230, 126, 34, 0.35) !important;
    transform: translateY(-2px);
  }
  .hover-qty-btn {
    transition: background-color 0.2s ease, color 0.2s ease !important;
  }
  .hover-qty-btn:hover {
    background-color: #2C3E50 !important;
    color: #ffffff !important;
  }
  .hover-related-item {
    transition: all 0.25s ease !important;
  }
  .hover-related-item:hover {
    background-color: #F8FAFC !important;
    transform: translateX(4px);
  }
`;

const styles = {
  container: { padding: '40px 6%', backgroundColor: '#FAFAFA', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, Arial, sans-serif' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: '20px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid #E67E22', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  layoutGrid: { display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '30px', alignItems: 'start' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '25px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '30px' },
  mainCard: { display: 'flex', gap: '40px', backgroundColor: '#ffffff', padding: '35px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' },
  imageWrapper: { flex: '0 0 280px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  mainImg: { width: '100%', borderRadius: '12px', boxShadow: '0 12px 32px rgba(44,62,80,0.1)', objectFit: 'contain', maxHeight: '400px' },
  infoWrapper: { flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' },
  bookTitle: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#2C3E50', lineHeight: '1.25', letterSpacing: '-0.3px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748B' },
  metaValue: { color: '#2C3E50', fontWeight: '700' },
  bulletSeparator: { color: '#CBD5E1' },
  ratingBadgeRow: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFF7ED', padding: '6px 16px', borderRadius: '30px', width: 'fit-content', border: '1px solid #FFEDD5' },
  starsBox: { display: 'flex', alignItems: 'center' },
  ratingText: { fontSize: '14px', fontWeight: '700', color: '#E67E22' },
  pipe: { color: '#FFD8A8' },
  soldText: { fontSize: '13.5px', color: '#475569', fontWeight: '600' },
  priceCard: { backgroundColor: '#F8FAFC', padding: '22px', borderRadius: '12px', marginTop: '6px', borderLeft: '4px solid #E67E22', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' },
  priceSubRow: { display: 'flex', alignItems: 'center', gap: '15px' },
  mainPrice: { fontSize: '30px', fontWeight: '800', color: '#E67E22', letterSpacing: '-0.5px' },
  taxBadge: { backgroundColor: 'transparent', border: '1px solid #E67E22', color: '#E67E22', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' },
  priceNotice: { margin: '6px 0 0 0', fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' },
  purchaseSection: { display: 'flex', alignItems: 'center', gap: '25px', margin: '15px 0', paddingBottom: '15px', borderBottom: '1px solid #E2E8F0' },
  qtyLabel: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  qtyContainer: { display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden', height: '38px' },
  qtyBtn: { width: '38px', height: '100%', border: 'none', backgroundColor: '#F8FAFC', cursor: 'pointer', fontSize: '16px', fontWeight: '700', color: '#475569' },
  qtyInput: { width: '45px', height: '100%', border: 'none', borderLeft: '1px solid #CBD5E1', borderRight: '1px solid #CBD5E1', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#2C3E50', outline: 'none' },
  btnRow: { marginTop: '5px' },
  cartBtn: { backgroundColor: '#2C3E50', color: '#ffffff', border: 'none', padding: '16px 45px', borderRadius: '10px', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 6px 20px rgba(44, 62, 80, 0.15)', width: '100%', maxWidth: '340px', letterSpacing: '0.3px' },
  sectionCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' },
  sectionHeader: { margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#2C3E50', borderLeft: '4px solid #E67E22', paddingLeft: '12px', letterSpacing: '0.2px' },
  description: { margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.8', textAlign: 'justify' },
  sideCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' },
  sideTitle: { margin: '0 0 16px 0', fontSize: '15.5px', fontWeight: '800', color: '#2C3E50', borderBottom: '2px solid #F1F5F9', paddingBottom: '12px' },
  specTable: { width: '100%', borderCollapse: 'collapse' },
  tdLabel: { padding: '11px 0', fontSize: '13.5px', color: '#64748B', width: '45%' },
  tdValue: { padding: '11px 0', fontSize: '13.5px', color: '#2C3E50', fontWeight: '600', textAlign: 'right' },
  emptyContainer: { padding: '45px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' },
  emptyIcon: { fontSize: '32px', marginBottom: '10px' },
  emptyTitle: { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#475569' },
  emptyDesc: { margin: 0, fontSize: '13px', color: '#94A3B8', lineHeight: '1.45' },
  reviewsList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  reviewItem: { borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' },
  reviewMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  reviewUser: { fontWeight: '700', color: '#2C3E50' },
  reviewDate: { color: '#94A3B8' },
  reviewComment: { margin: '8px 0 0 0', fontSize: '14px', color: '#334155', lineHeight: '1.6' },
  reviewImgThumb: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'zoom-in' },
  emptyMiniContainer: { padding: '24px 12px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px' },
  emptyMiniText: { margin: 0, fontSize: '13px', color: '#94A3B8', lineHeight: '1.45' },
  relatedList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  relatedRowItem: { display: 'flex', gap: '14px', cursor: 'pointer', padding: '10px', borderRadius: '10px', border: '1px solid transparent' },
  relatedMiniImg: { width: '64px', height: '90px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  relatedMiniInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' },
  relatedMiniTitle: { margin: 0, fontSize: '13.5px', color: '#2C3E50', fontWeight: '700', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' },
  relatedMiniPrice: { fontSize: '13.5px', fontWeight: '700', color: '#E67E22' }
};

export default ProductDetailPage;