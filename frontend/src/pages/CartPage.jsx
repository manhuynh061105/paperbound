import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService } from '../services/api';
import { toast } from 'react-toastify'; // FIX LỖI 1: Bổ sung import toast để tránh crash trang

const CartPage = ({ refreshCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // FIX LỖI 2: Lấy userId động từ Session của tài khoản đang đăng nhập thật
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  const loadCart = () => {
    // Nếu chưa đăng nhập thì không gọi API để tránh lỗi Server
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

  // Xử lý tăng/giảm số lượng bằng nút bấm
  const handleQuantityChange = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    
    // Nếu giảm xuống 0 thì tự động kích hoạt hàm xóa sản phẩm
    if (newQty === 0) {
      handleDeleteItem(productId);
      return;
    }

    try {
      await cartService.updateQuantity({ userId, productId, quantity: newQty });
      loadCart(); // Reload lại bảng tính tiền dựa trên ID động mới
      refreshCartCount(); // Đồng bộ lại badge giỏ hàng trên Header
    } catch (error) {
      toast.error("Cập nhật số lượng thất bại: " + error.message);
    }
  };

  const handleDeleteItem = async (productId) => {
    try {
      await cartService.deleteItem(userId, productId);
      loadCart();
      toast.error("🗑️ Đã xóa sản phẩm khỏi giỏ hàng."); 
      refreshCartCount(); 
    } catch (error) {
      toast.error("Xóa thất bại: " + error.message);
    }
  };

  // Tính toán tiền bạc dựa trên dữ liệu thật của User đang đăng nhập
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const taxAmount = subtotal * 0.05; 
  const shippingFee = cartItems.length > 0 ? 20000 : 0; 
  const totalAmount = subtotal + taxAmount + shippingFee;

  if (loading) return <div style={styles.loadingText}>Đang đọc dữ liệu giỏ hàng của bạn...</div>;

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2C3E50', marginBottom: '25px', fontWeight: 'bold' }}>🛒 Giỏ Hàng Của Bạn</h2>

      {cartItems.length === 0 ? (
        <div style={styles.emptyCartBlock}>
          <p style={{ fontSize: '16px', marginBottom: '15px' }}>Giỏ hàng của bạn đang trống trơn. Quay lại sắm sách nhé!</p>
          <button onClick={() => navigate('/')} style={styles.checkoutBtn}>Tiếp tục mua sắm</button>
        </div>
      ) : (
        <div style={styles.cartContent}>
          
          {/* DANH SÁCH SẢN PHẨM TRONG GIỎ */}
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

                <div style={styles.itemDetails}>
                  {/* Tên sách */}
                  <Link to={`/products/${item.product_id}`} style={styles.productLink}>
                    <h4 style={styles.itemTitle}>{item.title}</h4>
                  </Link>
                  <p style={styles.itemPrice}>{Number(item.price).toLocaleString()} VNĐ</p>
                  
                  {/* CỤM NÚT TĂNG GIẢM SỐ LƯỢNG */}
                  <div style={styles.quantityContainer}>
                    <button 
                      onClick={() => handleQuantityChange(item.product_id, item.quantity, -1)} 
                      style={styles.qtyBtn}
                    >
                      -
                    </button>
                    <span style={styles.qtyText}>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.product_id, item.quantity, 1)} 
                      style={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button onClick={() => handleDeleteItem(item.product_id)} style={styles.deleteBtn}>
                  Xóa 🗑️
                </button>
              </div>
            ))}
          </div>

          {/* KHU VỰC TÍNH TIỀN (THUẾ VAT 5%) */}
          <div style={styles.summarySection}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #eee', paddingBottom: '10px', fontSize: '17px', color: '#2C3E50', fontWeight: 'bold' }}>
              Tóm tắt đơn hàng
            </h3>
            <div style={styles.summaryRow}>
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString()} VNĐ</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Thuế VAT (5%):</span>
              <span>{taxAmount.toLocaleString()} VNĐ</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Phí vận chuyển:</span>
              <span>{shippingFee.toLocaleString()} VNĐ</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
            <div style={{ ...styles.summaryRow, fontWeight: 'bold', fontSize: '18px', color: '#E67E22' }}>
              <span>Tổng cộng:</span>
              <span>{totalAmount.toLocaleString()} VNĐ</span>
            </div>

            <button onClick={() => navigate('/checkout')} style={{ ...styles.checkoutBtn, width: '100%', marginTop: '20px' }}>
              Tiến Hành Thanh Toán ➔
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

const styles = {
  container: { paddingBottom: '40px' },
  loadingText: { padding: '40px', textAlign: 'center', color: '#555' },
  emptyCartBlock: { textAlign: 'center', padding: '50px 0', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  cartContent: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
  listSection: { flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' },
  summarySection: { flex: 1, minWidth: '280px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content' },
  cartCard: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', gap: '15px' },
  itemImage: { width: '70px', height: '95px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #eee' },
  itemDetails: { flex: 1 },
  productLink: { textDecoration: 'none' },
  itemTitle: { margin: '0 0 5px 0', fontSize: '15px', color: '#2C3E50', cursor: 'pointer', fontWeight: 'bold' },
  itemPrice: { margin: '0 0 10px 0', color: '#E67E22', fontWeight: 'bold', fontSize: '14px' },
  quantityContainer: { display: 'flex', alignItems: 'center', gap: '5px' },
  qtyBtn: { width: '28px', height: '28px', backgroundColor: '#f1f2f6', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', outline: 'none' },
  qtyText: { width: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' },
  deleteBtn: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#555' },
  checkoutBtn: { backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
};

export default CartPage;