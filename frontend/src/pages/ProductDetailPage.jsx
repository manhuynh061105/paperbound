import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, cartService } from '../services/api'; // 💡 ĐÃ BỔ SUNG: Import cartService để gọi trực tiếp API
import { toast } from 'react-toastify';

const ProductDetailPage = ({ onAddToCart, refreshCartCount, currentUser }) => { // 💡 Đã đổi prop từ onAddToCart thành refreshCartCount để đồng bộ icon giỏ hàng trên Header
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]); 
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin người dùng đang đăng nhập thực tế từ LocalStorage
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  useEffect(() => {
    window.scrollTo(0, 0); 
    setLoading(true);

    console.log("🔍 Đang nạp dữ liệu thực cho Product ID:", id);

    Promise.all([
      productService.getById(id).catch(err => {
        console.error("❌ Lỗi API lấy chi tiết sách:", err);
        return null;
      }),
      productService.getRelated(id).catch(err => {
        console.error("❌ Lỗi API sách liên quan:", err);
        return { data: { data: [] } };
      }),
      productService.getById(`${id}/reviews`).catch(() => ({ data: { data: [] } }))
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
      console.error("🔥 Lỗi hệ thống:", err);
      toast.error("❌ Có lỗi xảy ra khi tải dữ liệu trang!");
    })
    .finally(() => setLoading(false));
    
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#7f8c8d', fontWeight: '500' }}>Đang tải thông tin sách thực tế...</p>
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

  // 💡 ĐÃ SỬA CHUẨN: Gọi đúng hàm .add từ cartService
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
      // Đóng gói Payload: Ép kiểu Số nguyên (Number) chắc chắn để triệt tiêu hoàn toàn lỗi [object Object]
      const payload = {
        userId: Number(userId),
        productId: Number(product.id),
        quantity: Number(quantity)
      };

      console.log("🚀 Gửi dữ liệu giỏ hàng chuẩn lên API:", payload);
      
      // 💥 THAY ĐỔI CHÍNH Ở ĐÂY: Chuyển từ .updateQuantity thành .add
      const response = await cartService.add(payload); 
      
      toast.success(`🛒 Đã thêm ${quantity} cuốn "${product.title}" vào giỏ hàng thành công!`);
      
      // Kích hoạt hàm đồng bộ số lượng giỏ hàng trên thanh Header chính
      if (refreshCartCount) {
        refreshCartCount();
      }

    } catch (error) {
      console.error("❌ Lỗi API khi thêm giỏ hàng:", error);
      toast.error("Không thể thêm vào giỏ hàng: " + (error.response?.data?.message || error.message));
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floorRating = Math.floor(rating || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= floorRating ? '#F14D5C' : '#E0E0E0', fontSize: '16px', marginRight: '2px' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div style={styles.container}>
      {/* BỐ CỤC HAI CỘT CHUẨN E-COMMERCE */}
      <div style={styles.layoutGrid}>
        
        {/* ================= CỘT TRÁI (CHI TIẾT VÀ MÔ TẢ) ================= */}
        <div style={styles.leftColumn}>
          
          {/* Khối thông tin cốt lõi */}
          <div style={styles.mainCard}>
            <div style={styles.imageWrapper}>
              <img 
                src={product.cover_image || 'https://via.placeholder.com/300x420?text=Paperbound'} 
                alt={product.title} 
                style={styles.mainImg} 
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

              {/* Bộ chọn số lượng */}
              <div style={styles.purchaseSection}>
                <span style={styles.qtyLabel}>Số lượng</span>
                <div style={styles.qtyContainer}>
                  <button onClick={() => handleQuantityChange(quantity - 1)} style={styles.qtyBtn}>-</button>
                  <input type="text" value={quantity} readOnly style={styles.qtyInput} />
                  <button onClick={() => handleQuantityChange(quantity + 1)} style={styles.qtyBtn}>+</button>
                </div>
              </div>

              {/* Nút tác vụ */}
              <div style={styles.btnRow}>
                <button 
                  onClick={handleBuyClick} 
                  style={{...styles.cartBtn, opacity: product.stock_quantity <= 0 ? 0.6 : 1}}
                  disabled={product.stock_quantity <= 0}
                >
                  {product.stock_quantity > 0 ? '🛒 THÊM VÀO GIỎ HÀNG' : '❌ HẾT HÀNG TẠM THỜI'}
                </button>
              </div>
            </div>
          </div>

          {/* Khối Mô tả nội dung */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionHeader}>📝 Tóm tắt nội dung tác phẩm</h3>
            <p style={styles.description}>
              {product.description || "Cuốn sách này hiện chưa có bài tóm tắt nội dung chi tiết từ nhà phát hành. Hệ thống sẽ sớm tự động cập nhật bài giới thiệu trong thời gian tới."}
            </p>
          </div>

          {/* Khối Đánh giá (Reviews) */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionHeader}>💬 Đánh giá từ cộng đồng độc giả</h3>
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
                      <span style={styles.reviewUser}>👤 {rev.user_name || rev.user || "Khách hàng"}</span>
                      <span style={styles.reviewDate}>{rev.created_at || rev.date || "Vừa xong"}</span>
                    </div>
                    <div style={{ margin: '4px 0' }}>{renderStars(rev.rating)}</div>
                    <p style={styles.reviewComment}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ================= CỘT PHẢI (THÔNG SỐ & SÁCH LIÊN QUAN) ================= */}
        <div style={styles.rightColumn}>
          
          {/* Khối thông số kỹ thuật */}
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
                  <td style={{...styles.tdValue, color: product.stock_quantity > 0 ? '#2ECC71' : '#E74C3C', fontWeight: 'bold'}}>
                    {product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Khối gợi ý sản phẩm cùng thể loại */}
          <div style={styles.sideCard}>
            <h4 style={styles.sideTitle}>📚 Tác phẩm cùng thể loại</h4>
            {relatedProducts.length === 0 ? (
              <div style={styles.emptyMiniContainer}>
                <p style={styles.emptyMiniText}>Chưa có đầu sách liên quan nào khác thuộc danh mục này.</p>
              </div>
            ) : (
              <div style={styles.relatedList}>
                {relatedProducts.map(item => (
                  <div key={item.id} style={styles.relatedRowItem} onClick={() => navigate(`/products/${item.id}`)}>
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

// ================= THIẾT KẾ STYLESHEET CAO CẤP =================
const styles = {
  container: { padding: '40px 8%', backgroundColor: '#F4F6F8', minHeight: '90vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: '20px' },
  spinner: { width: '45px', height: '45px', border: '4px solid #f3f3f3', borderTop: '4px solid #F14D5C', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  layoutGrid: { display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '30px', alignItems: 'start' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '25px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '20px' },
  mainCard: { display: 'flex', gap: '35px', backgroundColor: '#ffffff', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 24 rgba(0,0,0,0.03)' },
  imageWrapper: { flex: '0 0 280px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  mainImg: { width: '100%', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', objectFit: 'contain', maxHeight: '380px' },
  infoWrapper: { flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' },
  bookTitle: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#1A2530', lineHeight: '1.3' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#7F8C8D' },
  metaValue: { color: '#2C3E50', fontWeight: '600' },
  bulletSeparator: { color: '#BDC3C7' },
  ratingBadgeRow: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FDF2F3', padding: '6px 14px', borderRadius: '30px', width: 'fit-content' },
  starsBox: { display: 'flex', alignItems: 'center' },
  ratingText: { fontSize: '14px', fontWeight: 'bold', color: '#F14D5C' },
  pipe: { color: '#ECC2C5' },
  soldText: { fontSize: '13.5px', color: '#666', fontWeight: '500' },
  priceCard: { backgroundColor: '#FFF5F6', padding: '20px', borderRadius: '12px', marginTop: '10px', borderLeft: '5px solid #F14D5C' },
  priceSubRow: { display: 'flex', alignItems: 'center', gap: '15px' },
  mainPrice: { fontSize: '28px', fontWeight: '800', color: '#F14D5C', letterSpacing: '-0.5px' },
  taxBadge: { backgroundColor: 'transparent', border: '1px solid #F14D5C', color: '#F14D5C', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' },
  priceNotice: { margin: '6px 0 0 0', fontSize: '12px', color: '#95A5A6', italic: 'true' },
  purchaseSection: { display: 'flex', alignItems: 'center', gap: '25px', margin: '15px 0', paddingBottom: '15px', borderBottom: '1px solid #F2F4F5' },
  qtyLabel: { fontSize: '14px', fontWeight: '700', color: '#566573' },
  qtyContainer: { display: 'flex', alignItems: 'center', border: '1px solid #D5DBDB', borderRadius: '8px', overflow: 'hidden', height: '38px' },
  qtyBtn: { width: '38px', height: '100%', border: 'none', backgroundColor: '#F8F9F9', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#5D6D7E', transition: 'background 0.2s' },
  qtyInput: { width: '45px', height: '100%', border: 'none', borderLeft: '1px solid #D5DBDB', borderRight: '1px solid #D5DBDB', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#2C3E50', outline: 'none' },
  btnRow: { marginTop: '5px' },
  cartBtn: { backgroundColor: '#F14D5C', color: '#ffffff', border: 'none', padding: '15px 45px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 25px rgba(241, 77, 92, 0.25)', transition: 'all 0.3s ease', width: '100%', maxWidth: '320px' },
  sectionCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' },
  sectionHeader: { margin: '0 0 18px 0', fontSize: '17px', fontWeight: '800', color: '#2C3E50', borderLeft: '4px solid #F14D5C', paddingLeft: '12px' },
  description: { margin: 0, fontSize: '15px', color: '#4A5568', lineHeight: '1.75', textAlign: 'justify' },
  sideCard: { backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' },
  sideTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#2C3E50', borderBottom: '2px solid #F2F4F5', paddingBottom: '10px' },
  specTable: { width: '100%', borderCollapse: 'collapse' },
  tdLabel: { padding: '10px 0', fontSize: '13.5px', color: '#85929E', width: '40%' },
  tdValue: { padding: '10px 0', fontSize: '13.5px', color: '#2C3E50', fontWeight: '600', textAlign: 'right' },
  emptyContainer: { padding: '40px 20px', textAlign: 'center', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1px dashed #E0E0E0' },
  emptyIcon: { fontSize: '32px', marginBottom: '10px' },
  emptyTitle: { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#566573' },
  emptyDesc: { margin: 0, fontSize: '13px', color: '#A6ACAF', lineHeight: '1.4' },
  reviewsList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  reviewItem: { borderBottom: '1px solid #F2F4F5', paddingBottom: '16px' },
  reviewMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  reviewUser: { fontWeight: '700', color: '#2C3E50' },
  reviewDate: { color: '#95A5A6' },
  reviewComment: { margin: '6px 0 0 0', fontSize: '14px', color: '#566573', lineHeight: '1.5' },
  emptyMiniContainer: { padding: '20px 10px', textAlign: 'center', backgroundColor: '#FDFEFE', borderRadius: '8px' },
  emptyMiniText: { margin: 0, fontSize: '12.5px', color: '#95A5A6', lineHeight: '1.4' },
  relatedList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  relatedRowItem: { display: 'flex', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' },
  relatedMiniImg: { width: '60px', height: '85px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  relatedMiniInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' },
  relatedMiniTitle: { margin: 0, fontSize: '13.5px', color: '#2C3E50', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  relatedMiniPrice: { fontSize: '13.5px', fontWeight: '700', color: '#F14D5C' }
};

export default ProductDetailPage;