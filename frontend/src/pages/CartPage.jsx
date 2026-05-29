import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService } from '../services/api';
import { toast } from 'react-toastify';

const CartPage = ({ refreshCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Lấy userId động từ Session của tài khoản đang đăng nhập thật
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  const loadCart = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    cartService.getByUserId(userId)
      .then(res => {
        setCartItems(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy giỏ hàng từ API:", err);
        setLoading(false);
      });
  };

  // Tự động kiểm tra quyền truy cập khi vào trang Giỏ Hàng
  useEffect(() => {
    if (!userId) {
      toast.warning("🔒 Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn!");
      navigate('/auth');
      return;
    }
    loadCart();
  }, [userId]);

  // Xử lý tăng/giảm số lượng bằng nút bấm (Có chặn giới hạn tồn kho stock_quantity)
  const handleQuantityChange = async (productId, currentQty, delta, stockQuantity) => {
    const newQty = currentQty + delta;
    
    // Nếu giảm xuống 0 thì tự động kích hoạt hàm xóa sản phẩm
    if (newQty === 0) {
      handleDeleteItem(productId);
      return;
    }

    // Chặn nếu người dùng tăng vượt quá số lượng tồn kho trong DB
    if (delta > 0 && stockQuantity !== undefined && newQty > stockQuantity) {
      toast.warning(`⚠️ Chỉ còn tối đa ${stockQuantity} sản phẩm trong kho!`);
      return;
    }

    try {
      await cartService.updateQuantity({ userId, productId, quantity: newQty });
      loadCart(); // Reload lại bảng tính tiền
      refreshCartCount(); // Đồng bộ lại badge giỏ hàng trên Header
    } catch (error) {
      toast.error("Cập nhật số lượng thất bại: " + error.message);
    }
  };

  const handleDeleteItem = async (productId) => {
    try {
      await cartService.deleteItem(userId, productId);
      loadCart();
      toast.info("🗑️ Đã xóa sản phẩm khỏi giỏ hàng."); 
      refreshCartCount(); 
    } catch (error) {
      toast.error("Xóa thất bại: " + error.message);
    }
  };

  // Tính toán tiền bạc dựa trên dữ liệu thật của User đang đăng nhập
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const taxAmount = subtotal * 0.05; // Thuế VAT 5% cố định hệ thống Paperbound
  const shippingFee = cartItems.length > 0 ? 20000 : 0; 
  const totalAmount = subtotal + taxAmount + shippingFee;

  if (loading) return <div style={styles.loadingText}>🔮 Đang kết nối thư viện và đọc giỏ hàng của bạn...</div>;

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.breadCrumb}>
        <Link to="/" style={styles.crumbLink}>Trang chủ</Link> / <span style={{ color: '#666' }}>Giỏ hàng</span>
      </div>

      <h2 style={styles.pageTitle}>🛒 GIỎ HÀNG CỦA BẠN <span style={styles.titleCount}>({cartItems.length} sản phẩm)</span></h2>

      {cartItems.length === 0 ? (
        <div style={styles.emptyCartBlock}>
          <div style={{ fontSize: '70px', marginBottom: '15px' }}>📚</div>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px', fontWeight: '500' }}>Giỏ hàng của bạn đang trống trơn. Quay lại sắm sách nhé!</p>
          <button onClick={() => navigate('/')} style={styles.continueShoppingBtn}>QUAY LẠI CỬA HÀNG</button>
        </div>
      ) : (
        <div style={styles.cartContent}>
          
          {/* DANH SÁCH SẢN PHẨM TRONG GIỎ (BẢNG HIỂN THỊ KHOA HỌC) */}
          <div style={styles.listSection}>
            {cartItems.map(item => (
              <div key={item.product_id} style={styles.cartCard}>
                
                {/* Ảnh bìa sách */}
                <Link to={`/products/${item.product_id}`}>
                  <img 
                    src={item.cover_image || 'https://via.placeholder.com/150x200?text=No+Cover'} 
                    alt={item.title} 
                    style={styles.itemImage} 
                  />
                </Link>

                {/* Chi tiết sách */}
                <div style={styles.itemDetails}>
                  <Link to={`/products/${item.product_id}`} style={styles.productLink}>
                    <h4 style={styles.itemTitle}>{item.title}</h4>
                  </Link>
                  <p style={styles.itemAuthor}>Tác giả: {item.author || 'Chưa rõ'}</p>
                  
                  {/* Hiển thị số lượng tồn kho thực tế */}
                  <div style={styles.stockStatus}>
                    <span style={styles.stockDot}></span>
                    Còn lại trong kho: <strong style={{ color: '#2C3E50' }}>{item.stock_quantity ?? 0}</strong> quyển
                  </div>

                  <p style={styles.itemPrice}>{Number(item.price).toLocaleString()} VNĐ</p>
                </div>

                {/* CỤM NÚT TĂNG GIẢM SỐ LƯỢNG BIẾN THỂ ĐẸP */}
                <div style={styles.actionWrapper}>
                  <div style={styles.quantityContainer}>
                    <button 
                      onClick={() => handleQuantityChange(item.product_id, item.quantity, -1, item.stock_quantity)} 
                      style={styles.qtyBtn}
                    >
                      -
                    </button>
                    <span style={styles.qtyText}>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.product_id, item.quantity, 1, item.stock_quantity)} 
                      style={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Thành tiền riêng của từng cuốn */}
                  <span style={styles.itemSubtotal}>
                    { (Number(item.price) * item.quantity).toLocaleString() } VNĐ
                  </span>
                </div>

                {/* NÚT XÓA ICON TRÒN TINH TẾ */}
                <button onClick={() => handleDeleteItem(item.product_id)} style={styles.deleteBtn} title="Xóa khỏi giỏ hàng">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* KHU VỰC TÍNH TIỀN (THUẾ VAT 5% - ĐỒNG BỘ ĐỎ THƯƠNG HIỆU) */}
          <div style={styles.summarySection}>
            <h3 style={styles.summaryTitle}>TÓM TẮT ĐƠN HÀNG</h3>
            
            <div style={styles.summaryRow}>
              <span>Tạm tính ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} sản phẩm):</span>
              <span style={styles.valueText}>{subtotal.toLocaleString()} VNĐ</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Thuế giá trị gia tăng (VAT 5%):</span>
              <span style={styles.valueText}>{taxAmount.toLocaleString()} VNĐ</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Phí vận chuyển toàn quốc:</span>
              <span style={styles.valueText}>{shippingFee.toLocaleString()} VNĐ</span>
            </div>
            
            <hr style={styles.divider} />
            
            <div style={{ ...styles.summaryRow, marginBottom: '25px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2C3E50' }}>Tổng số tiền thanh toán:</span>
              <span style={styles.totalPriceText}>{totalAmount.toLocaleString()} VNĐ</span>
            </div>

            <button onClick={() => navigate('/checkout')} style={styles.checkoutBtn}>
              TIẾN HÀNH THANH TOÁN ➔
            </button>
            
            <button onClick={() => navigate('/')} style={styles.backStoreBtn}>
              ❰ Tiếp tục mua thêm sách
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px 0 60px 0', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  loadingText: { padding: '80px 20px', textAlign: 'center', color: '#F14D5C', fontSize: '16px', fontWeight: 'bold' },
  breadCrumb: { fontSize: '13px', color: '#999', marginBottom: '20px' },
  crumbLink: { textDecoration: 'none', color: '#F14D5C', fontWeight: '500' },
  pageTitle: { color: '#2C3E50', marginBottom: '30px', fontWeight: '800', fontSize: '22px', borderBottom: '3px solid #F14D5C', paddingBottom: '12px', letterSpacing: '0.5px' },
  titleCount: { fontSize: '16px', color: '#7f8c8d', fontWeight: 'normal' },
  
  emptyCartBlock: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' },
  continueShoppingBtn: { backgroundColor: '#F14D5C', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(241,77,92,0.2)', transition: 'all 0.2s' },

  cartContent: { display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' },
  listSection: { flex: 2.3, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' },
  
  // Card Sản phẩm thiết kế ngang thanh lịch
  cartCard: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '18px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', gap: '20px', border: '1px solid #f1f2f6', position: 'relative', transition: 'transform 0.2s' },
  itemImage: { width: '80px', height: '110px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' },
  itemDetails: { flex: 1.2, display: 'flex', flexDirection: 'column', gap: '5px' },
  productLink: { textDecoration: 'none' },
  itemTitle: { margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: '700', transition: 'color 0.2s', lineHeight: '1.4' },
  itemAuthor: { margin: 0, fontSize: '12.5px', color: '#7f8c8d' },
  itemPrice: { margin: '6px 0 0 0', color: '#2C3E50', fontWeight: '700', fontSize: '15px' },
  
  // Trạng thái kho hàng tích hợp
  stockStatus: { fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', width: 'fit-content', marginTop: '2px' },
  stockDot: { width: '6px', height: '6px', backgroundColor: '#2ecc71', borderRadius: '50%' },

  // Cụm action số lượng và thành tiền vách phải
  actionWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', minWidth: '130px' },
  quantityContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#f5f6fa', borderRadius: '6px', border: '1px solid #e1e4e8', padding: '2px' },
  qtyBtn: { width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyText: { width: '34px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#2C3E50' },
  itemSubtotal: { fontSize: '16px', fontWeight: 'bold', color: '#F14D5C' },
  
  // Nút xóa chéo tinh gọn góc phải top
  deleteBtn: { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fff', border: '1px solid #eddcdb', color: '#95a5a6', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', transition: 'all 0.2s', fontWeight: 'bold' },

  // Biên nhận tính tiền bên phải gọn gàng vững chãi
  summarySection: { flex: 1, minWidth: '320px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f2f6', height: 'fit-content', position: 'sticky', top: '20px' },
  summaryTitle: { margin: '0 0 20px 0', borderBottom: '2px solid #F14D5C', paddingBottom: '12px', fontSize: '15px', color: '#2C3E50', fontWeight: '800', letterSpacing: '0.5px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13.5px', color: '#666', alignItems: 'center' },
  valueText: { fontWeight: '600', color: '#2C3E50' },
  divider: { border: 'none', borderTop: '1px dashed #dfe4ea', margin: '18px 0' },
  totalPriceText: { fontSize: '20px', fontWeight: '800', color: '#F14D5C' },
  
  checkoutBtn: { backgroundColor: '#F14D5C', color: 'white', border: 'none', padding: '14px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textAlign: 'center', width: '100%', boxShadow: '0 4px 15px rgba(241,77,92,0.25)', transition: 'all 0.2s', letterSpacing: '0.5px' },
  backStoreBtn: { backgroundColor: 'transparent', color: '#666', border: 'none', padding: '10px 0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', width: '100%', marginTop: '12px', transition: 'color 0.2s', textAlign: 'center' }
};

export default CartPage;