import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services/api';
import { toast } from 'react-toastify'; // Bổ sung import toast

const CheckoutPage = ({ refreshCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  // Trạng thái hóa đơn đỏ VAT 5% theo yêu cầu của thầy
  const [needInvoice, setNeedInvoice] = useState(false);
  const [billingInfo, setBillingInfo] = useState({ taxId: '', billingName: '' });
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // FIX LỖI 1: Lấy userId động từ Session của tài khoản đang đăng nhập thật trong hệ thống
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  // 1. Kiểm tra đăng nhập và tải thông tin giỏ hàng chốt đơn
  useEffect(() => {
    if (!userId) {
      toast.warning("🔒 Vui lòng đăng nhập để tiến hành thanh toán đơn hàng!");
      navigate('/auth');
      return;
    }

    cartService.getByUserId(userId)
      .then(res => {
        const items = res.data.data || [];
        if (items.length === 0) {
          toast.info("🛒 Giỏ hàng của bạn đang trống, hãy chọn một vài cuốn sách trước nhé!");
          navigate('/');
          return;
        }
        setCartItems(items);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin thanh toán:", err);
        toast.error("❌ Không thể tải dữ liệu giỏ hàng để chốt đơn!");
        setLoading(false);
      });
  }, [userId, navigate]);

  // 2. Tính toán chi phí khớp hoàn toàn với trang giỏ hàng và Backend
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const taxAmount = subtotal * 0.05; 
  const shippingFee = cartItems.length > 0 ? 20000 : 0; // Tự động về 0 nếu không có item nào
  const totalAmount = subtotal + taxAmount + shippingFee;

  // 3. Xử lý gửi lệnh Thanh toán sang Backend
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    const checkoutData = {
      userId, // Truyền ID thật của phiên đăng nhập hiện tại
      shippingAddress,
      paymentMethod,
      needInvoice,
      billingInfo: needInvoice ? billingInfo : null,
      items: cartItems.map(item => ({
        id: item.product_id,
        price: Number(item.price),
        quantity: item.quantity
      }))
    };

    try {
      const response = await orderService.checkout(checkoutData);
      if (response.data.success) {
        toast.success(`🎉 ĐẶT HÀNG THÀNH CÔNG!\nMã đơn: ${response.data.orderId || 'SUCCESS'}\nKho hàng đã tự động cập nhật.`);
        
        // Đồng bộ lại badge giỏ hàng trên Header về số 0
        refreshCartCount(); 
        // Chuyển hướng người dùng về trang chủ
        navigate('/');
      }
    } catch (error) {
      toast.error("❌ Thanh toán thất bại: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div style={styles.loadingText}>Đang chuẩn bị luồng thanh toán...</div>;

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#2C3E50', marginBottom: '25px', fontWeight: 'bold' }}>💳 THÔNG TIN THANH TOÁN</h2>
      
      <div style={styles.contentLayout}>
        {/* FORM ĐIỀN THÔNG TIN GIAO HÀNG & HÓA ĐƠN (BÊN TRÁI) */}
        <div style={styles.formSection}>
          <form onSubmit={handleCheckoutSubmit}>
            <h3 style={styles.sectionTitle}>Thông tin nhận hàng</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Địa chỉ giao hàng thực tế:</label>
              <input 
                type="text" 
                placeholder="Số nhà, tên đường, quận/huyện, thành phố..." 
                required 
                value={shippingAddress} 
                onChange={e => setShippingAddress(e.target.value)} 
                style={styles.input} 
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phương thức thanh toán:</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)} 
                style={styles.input}
              >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="BANK">Chuyển khoản Ngân hàng (Mô phỏng QR)</option>
              </select>
            </div>

            {/* PHẦN ĐĂNG KÝ XUẤT HÓA ĐƠN DOANH NGHIỆP VAT 5% */}
            <div style={styles.invoiceCheckboxContainer}>
              <input 
                type="checkbox" 
                id="invoiceCheckbox" 
                checked={needInvoice} 
                onChange={e => setNeedInvoice(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="invoiceCheckbox" style={{ fontWeight: 'bold', cursor: 'pointer', color: '#2C3E50', fontSize: '14px' }}>
                &nbsp;Tôi muốn yêu cầu xuất hóa đơn đỏ (VAT 5%)
              </label>
            </div>

            {needInvoice && (
              <div style={styles.invoiceBox}>
                <h4 style={{ margin: '0 0 10px 0', color: '#E67E22', fontSize: '14px', fontWeight: 'bold' }}>Thông tin xuất hóa đơn:</h4>
                <input 
                  type="text" 
                  placeholder="Mã số thuế doanh nghiệp (Tax ID)" 
                  required 
                  value={billingInfo.taxId} 
                  onChange={e => setBillingInfo({ ...billingInfo, taxId: e.target.value })} 
                  style={styles.input} 
                />
                <input 
                  type="text" 
                  placeholder="Tên công ty / Đơn vị mua hàng" 
                  required 
                  value={billingInfo.billingName} 
                  onChange={e => setBillingInfo({ ...billingInfo, billingName: e.target.value })} 
                  style={styles.input} 
                />
              </div>
            )}

            <button type="submit" style={styles.submitOrderBtn}>
              XÁC NHẬN ĐẶT HÀNG & THANH TOÁN
            </button>
          </form>
        </div>

        {/* BẢNG TÓM TẮT ĐƠN HÀNG CHỐT GIÁ (BÊN PHẢI) */}
        <div style={styles.summarySection}>
          <h3 style={styles.sectionTitle}>Đơn hàng chốt</h3>
          <div style={styles.itemSummaryList}>
            {cartItems.map(item => (
              <div key={item.product_id} style={styles.itemRow}>
                <span style={{ fontSize: '14px', color: '#333' }}>{item.title} <b style={{ color: '#E67E22' }}>x{item.quantity}</b></span>
                <span style={{ fontWeight: 'bold', color: '#2C3E50' }}>{(item.price * item.quantity).toLocaleString()}đ</span>
              </div>
            ))}
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
          
          <div style={styles.priceRow}><span>Tạm tính:</span><span>{subtotal.toLocaleString()} đ</span></div>
          <div style={styles.priceRow}><span>Thuế VAT (5%):</span><span>{taxAmount.toLocaleString()} đ</span></div>
          <div style={styles.priceRow}><span>Phí vận chuyển:</span><span>{shippingFee.toLocaleString()} đ</span></div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '15px 0' }} />
          
          <div style={{ ...styles.priceRow, fontWeight: 'bold', fontSize: '18px', color: '#E67E22' }}>
            <span>Tổng số tiền:</span>
            <span>{totalAmount.toLocaleString()} đ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { paddingBottom: '40px' },
  loadingText: { padding: '40px', textAlign: 'center', color: '#555' },
  contentLayout: { display: 'flex', gap: '40px', flexWrap: 'wrap-reverse' },
  formSection: { flex: 1.5, minWidth: '320px', backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  summarySection: { flex: 1, minWidth: '280px', backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: 'fit-content' },
  sectionTitle: { margin: '0 0 20px 0', borderBottom: '2px solid #2C3E50', paddingBottom: '8px', color: '#2C3E50', fontSize: '17px', fontWeight: 'bold' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#444', fontSize: '13px' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '12px', fontSize: '14px', outline: 'none' },
  invoiceCheckboxContainer: { display: 'flex', alignItems: 'center', margin: '20px 0 12px 0' },
  invoiceBox: { backgroundColor: '#fdfbf7', border: '1px dashed #E67E22', padding: '15px', borderRadius: '6px', marginBottom: '20px' },
  submitOrderBtn: { width: '100%', backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', boxShadow: '0 3px 6px rgba(0,0,0,0.1)', transition: 'background 0.2s' },
  itemSummaryList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  itemRow: { display: 'flex', justifyContent: 'space-between' },
  priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#555', fontSize: '14px' }
};

export default CheckoutPage;