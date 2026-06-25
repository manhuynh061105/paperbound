import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService } from '../services/api';
import { toast } from 'react-toastify';

const CartPage = ({ refreshCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!userId) {
      toast.warning("🔒 Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn!");
      navigate('/auth');
      return;
    }
    loadCart();
  }, [userId]);

  const handleQuantityChange = async (productId, currentQty, delta, stockQuantity) => {
    const newQty = currentQty + delta;
    
    if (newQty === 0) {
      handleDeleteItem(productId);
      return;
    }

    if (delta > 0 && stockQuantity !== undefined && newQty > stockQuantity) {
      toast.warning(`⚠️ Chỉ còn tối đa ${stockQuantity} sản phẩm trong kho!`);
      return;
    }

    try {
      await cartService.updateQuantity({ userId, productId, quantity: newQty });
      loadCart();
      refreshCartCount();
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

  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const taxAmount = subtotal * 0.05; 
  const shippingFee = cartItems.length > 0 ? 20000 : 0; 
  const totalAmount = subtotal + taxAmount + shippingFee;

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>🔮 Đang kết nối thư viện và đọc giỏ hàng của bạn...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.breadCrumb}>
        <Link to="/" style={styles.crumbLink}>Trang chủ</Link>
        <span style={styles.crumbSeparator}>/</span>
        <span style={styles.crumbActive}>Giỏ hàng</span>
      </div>

      <h2 style={styles.pageTitle}>
        🛒 GIỎ HÀNG CỦA BẠN <span style={styles.titleCount}>({cartItems.length} sản phẩm)</span>
      </h2>

      {cartItems.length === 0 ? (
        <div style={styles.emptyCartBlock}>
          <div style={styles.emptyCartIcon}>📚</div>
          <p style={styles.emptyCartText}>Giỏ hàng của bạn đang trống trơn. Quay lại sắm sách nhé!</p>
          <button onClick={() => navigate('/')} style={styles.continueShoppingBtn}>QUAY LẠI CỬA HÀNG</button>
        </div>
      ) : (
        <div style={styles.cartContent}>
          
          <div style={styles.listSection}>
            {cartItems.map(item => (
              <div key={item.product_id} style={styles.cartCard}>
                
                <Link to={`/products/${item.product_id}`} style={styles.imageWrapper}>
                  <img 
                    src={item.cover_image || 'https://via.placeholder.com/150x200?text=No+Cover'} 
                    alt={item.title} 
                    style={styles.itemImage} 
                  />
                </Link>

                <div style={styles.itemDetails}>
                  <Link to={`/products/${item.product_id}`} style={styles.productLink}>
                    <h4 style={styles.itemTitle}>{item.title}</h4>
                  </Link>
                  <p style={styles.itemAuthor}>Tác giả: {item.author || 'Chưa rõ'}</p>
                  
                  <div style={styles.stockStatus}>
                    <span style={styles.stockDot}></span>
                    <span>Còn lại trong kho: <strong>{item.stock_quantity ?? 0}</strong> quyển</span>
                  </div>

                  <p style={styles.itemPrice}>{Number(item.price).toLocaleString()} đ</p>
                </div>

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
                  
                  <span style={styles.itemSubtotal}>
                    {(Number(item.price) * item.quantity).toLocaleString()} đ
                  </span>
                </div>

                <button onClick={() => handleDeleteItem(item.product_id)} style={styles.deleteBtn} title="Xóa khỏi giỏ hàng">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={styles.summarySection}>
            <h3 style={styles.summaryTitle}>TÓM TẮT ĐƠN HÀNG</h3>
            
            <div style={styles.summaryRow}>
              <span>Tạm tính ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} sản phẩm):</span>
              <span style={styles.valueText}>{subtotal.toLocaleString()} đ</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Thuế giá trị gia tăng (VAT 5%):</span>
              <span style={styles.valueText}>{taxAmount.toLocaleString()} đ</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Phí vận chuyển toàn quốc:</span>
              <span style={styles.valueText}>{shippingFee.toLocaleString()} đ</span>
            </div>
            
            <hr style={styles.divider} />
            
            <div style={{ ...styles.summaryRow, marginBottom: '24px' }}>
              <span style={styles.totalLabel}>Tổng số tiền thanh toán:</span>
              <span style={styles.totalPriceText}>{totalAmount.toLocaleString()} đ</span>
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
  container: { 
    padding: '30px 15px 60px 15px', 
    maxWidth: '1200px', 
    margin: '0 auto', 
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box'
  },
  loadingWrapper: {
    padding: '100px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    justifyContent: 'center'
  },
  spinner: {
    width: '35px',
    height: '35px',
    border: '3px solid #E2E8F0',
    borderTop: '3px solid #E67E22',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: { 
    color: '#64748B', 
    fontSize: '15px', 
    fontWeight: '600' 
  },
  breadCrumb: { 
    display: 'flex',
    gap: '8px',
    fontSize: '14px', 
    color: '#64748B', 
    marginBottom: '25px',
    alignItems: 'center'
  },
  crumbLink: { 
    textDecoration: 'none', 
    color: '#64748B', 
    fontWeight: '500',
    transition: 'color 0.2s'
  },
  crumbSeparator: {
    color: '#CBD5E1'
  },
  crumbActive: {
    color: '#2C3E50',
    fontWeight: '600'
  },
  pageTitle: { 
    color: '#2C3E50', 
    marginBottom: '30px', 
    fontWeight: '700', 
    fontSize: '22px', 
    borderBottom: '2px solid #E2E8F0', 
    paddingBottom: '16px', 
    letterSpacing: '0.3px' 
  },
  titleCount: { 
    fontSize: '16px', 
    color: '#64748B', 
    fontWeight: '400' 
  },
  emptyCartBlock: { 
    textAlign: 'center', 
    padding: '60px 20px', 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
    border: '1px solid #E2E8F0' 
  },
  emptyCartIcon: { 
    fontSize: '64px', 
    marginBottom: '20px' 
  },
  emptyCartText: { 
    fontSize: '15px', 
    color: '#64748B', 
    marginBottom: '24px', 
    fontWeight: '500' 
  },
  continueShoppingBtn: { 
    backgroundColor: '#E67E22', 
    color: '#ffffff', 
    border: 'none', 
    padding: '12px 28px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px', 
    boxShadow: '0 4px 12px rgba(230,126,34,0.15)', 
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  cartContent: { 
    display: 'flex', 
    gap: '30px', 
    flexWrap: 'wrap', 
    alignItems: 'flex-start' 
  },
  listSection: { 
    flex: 2.3, 
    minWidth: '320px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px' 
  },
  cartCard: { 
    display: 'flex', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: '20px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.01)', 
    gap: '20px', 
    border: '1px solid #E2E8F0', 
    position: 'relative', 
    transition: 'all 0.2s ease' 
  },
  imageWrapper: {
    display: 'block'
  },
  itemImage: { 
    width: '85px', 
    height: '115px', 
    objectFit: 'cover', 
    borderRadius: '8px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s ease'
  },
  itemDetails: { 
    flex: 1.2, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  productLink: { 
    textDecoration: 'none' 
  },
  itemTitle: { 
    margin: 0, 
    fontSize: '15.5px', 
    color: '#2C3E50', 
    fontWeight: '700', 
    transition: 'color 0.2s ease', 
    lineHeight: '1.4' 
  },
  itemAuthor: { 
    margin: 0, 
    fontSize: '13px', 
    color: '#64748B' 
  },
  stockStatus: { 
    fontSize: '12px', 
    color: '#475569', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    backgroundColor: '#F8FAFC', 
    padding: '5px 10px', 
    borderRadius: '6px', 
    width: 'fit-content', 
    marginTop: '2px' 
  },
  stockDot: { 
    width: '6px', 
    height: '6px', 
    backgroundColor: '#10B981', 
    borderRadius: '50%' 
  },
  itemPrice: { 
    margin: '4px 0 0 0', 
    color: '#2C3E50', 
    fontWeight: '700', 
    fontSize: '15px' 
  },
  actionWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-end', 
    gap: '12px', 
    minWidth: '140px' 
  },
  quantityContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: '8px', 
    border: '1px solid #E2E8F0', 
    padding: '3px' 
  },
  qtyBtn: { 
    width: '28px', 
    height: '28px', 
    backgroundColor: '#ffffff', 
    border: 'none', 
    borderRadius: '6px',
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px', 
    color: '#475569', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'background-color 0.15s'
  },
  qtyText: { 
    width: '36px', 
    textAlign: 'center', 
    fontWeight: '700', 
    fontSize: '13.5px', 
    color: '#1E293B' 
  },
  itemSubtotal: { 
    fontSize: '16px', 
    fontWeight: '700', 
    color: '#E67E22' 
  },
  deleteBtn: { 
    position: 'absolute', 
    top: '16px', 
    right: '16px', 
    backgroundColor: '#ffffff', 
    border: '1px solid #E2E8F0', 
    color: '#94A3B8', 
    width: '26px', 
    height: '26px', 
    borderRadius: '50%', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '11px', 
    transition: 'all 0.2s ease', 
    fontWeight: '700',
    outline: 'none'
  },
  summarySection: { 
    flex: 1, 
    minWidth: '320px', 
    backgroundColor: '#ffffff', 
    padding: '24px', 
    borderRadius: '16px', 
    boxShadow: '0 6px 24px rgba(0,0,0,0.02)', 
    border: '1px solid #E2E8F0', 
    height: 'fit-content', 
    position: 'sticky', 
    top: '30px' 
  },
  summaryTitle: { 
    margin: '0 0 20px 0', 
    borderBottom: '2px solid #E2E8F0', 
    paddingBottom: '14px', 
    fontSize: '15px', 
    color: '#2C3E50', 
    fontWeight: '700', 
    letterSpacing: '0.3px' 
  },
  summaryRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    marginBottom: '14px', 
    fontSize: '14px', 
    color: '#64748B', 
    alignItems: 'center' 
  },
  valueText: { 
    fontWeight: '600', 
    color: '#1E293B' 
  },
  divider: { 
    border: 'none', 
    borderTop: '1px dashed #E2E8F0', 
    margin: '20px 0' 
  },
  totalLabel: {
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#2C3E50'
  },
  totalPriceText: { 
    fontSize: '20px', 
    fontWeight: '700', 
    color: '#E67E22' 
  },
  checkoutBtn: { 
    backgroundColor: '#2C3E50', 
    color: '#ffffff', 
    border: 'none', 
    padding: '14px 20px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px', 
    textAlign: 'center', 
    width: '100%', 
    transition: 'all 0.2s ease', 
    letterSpacing: '0.3px',
    outline: 'none'
  },
  backStoreBtn: { 
    backgroundColor: 'transparent', 
    color: '#64748B', 
    border: 'none', 
    padding: '10px 0', 
    cursor: 'pointer', 
    fontSize: '13px', 
    fontWeight: '600', 
    width: '100%', 
    marginTop: '12px', 
    transition: 'color 0.2s easy', 
    textAlign: 'center',
    outline: 'none'
  }
};

export default CartPage;