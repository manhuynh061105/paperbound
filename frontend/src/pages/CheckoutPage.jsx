import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services/api'; // 💡 ĐÃ CẬP NHẬT: Thêm orderService để kết nối API thật
import { toast } from 'react-toastify';

const CheckoutPage = ({ refreshCartCount }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Form thông tin khách hàng
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: ''
  });

  // 💡 BỔ SUNG: State phục vụ cho phần kiểm tra xuất hóa đơn đỏ (Invoice)
  const [needInvoice, setNeedInvoice] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    taxId: '',
    billingName: ''
  });

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;

  useEffect(() => {
    if (!userId) {
      toast.error("🔒 Vui lòng đăng nhập để tiến hành thanh toán!");
      navigate('/auth');
      return;
    }

    // Lấy thông tin các sản phẩm trong giỏ hàng hiện tại để làm hóa đơn
    cartService.getByUserId(userId)
      .then(res => {
        const items = res.data.data || [];
        if (items.length === 0) {
          toast.warning("🛒 Giỏ hàng của bạn đang trống, không thể thanh toán!");
          navigate('/cart');
          return;
        }
        setCartItems(items);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu checkout:", err);
        toast.error("Không thể tải thông tin hóa đơn.");
      })
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  // Tính toán các con số tài chính giống y hệt bên CartPage
  const tempSubtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const totalTax = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity * (Number(item.tax_rate || 5) / 100)), 0);
  const shippingFee = tempSubtotal > 300000 || tempSubtotal === 0 ? 0 : 30000;
  const finalTotal = tempSubtotal + totalTax + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      toast.warning("📋 Vui lòng điền đầy đủ thông tin giao hàng bắt buộc!");
      return;
    }

    if (needInvoice && (!billingInfo.taxId || !billingInfo.billingName)) {
      toast.warning("📋 Vui lòng điền đầy đủ thông tin MST và Tên công ty để xuất hóa đơn!");
      return;
    }

    try {
      // 💡 ĐÃ CHỈNH SỬA: Đóng gói Payload chuẩn khít với cấu trúc bóc tách của orderController
      const orderPayload = {
        userId: Number(userId),
        shippingAddress: `Tên: ${shippingInfo.fullName} - SĐT: ${shippingInfo.phone} - ĐC: ${shippingInfo.address}${shippingInfo.notes ? ` (Ghi chú: ${shippingInfo.notes})` : ''}`,
        paymentMethod: 'COD',
        needInvoice: needInvoice,
        billingInfo: needInvoice ? billingInfo : null,
        totalAmountFromFE: finalTotal,
        taxAmountFromFE: totalTax,
        items: cartItems.map(item => ({
          price: Number(item.price),
          quantity: item.quantity,
          product_id: item.product_id
        }))
      };

      console.log("🚀 Đang bắn dữ liệu thật lên Backend:", orderPayload);
      
      // 💥 THỰC THI GỌI API THẬT THAY VÌ GIẢ LẬP
      const response = await orderService.create(orderPayload);
      
      console.log("📥 Kết quả từ Backend phản hồi:", response.data);

      if (response.data.success) {
        toast.success("🎉 Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận.");
        if (refreshCartCount) refreshCartCount(); // Làm mới bộ đếm giỏ hàng trên Header về 0
        navigate('/'); // Quay về trang chủ
      } else {
        toast.error("❌ Thất bại: " + response.data.message);
      }

    } catch (error) {
      console.error("Lỗi kết nối đặt đơn hàng:", error);
      const errorMsg = error.response?.data?.error || error.message;
      toast.error("Đặt hàng thất bại: " + errorMsg);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#7f8c8d' }}>Đang chuẩn bị hóa đơn thanh toán thực tế...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>💳 TIẾN HÀNH THANH TOÁN</h2>
      
      <div style={styles.checkoutGrid}>
        {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN GIAO HÀNG */}
        <div style={styles.infoSection}>
          <h3 style={styles.sectionHeader}>🚚 Thông tin nhận hàng</h3>
          <form onSubmit={handlePlaceOrder} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Họ và tên người nhận <span style={{color: '#F14D5C'}}>*</span></label>
              <input 
                type="text" 
                name="fullName" 
                value={shippingInfo.fullName} 
                onChange={handleInputChange}
                placeholder="Ví dụ: Nguyễn Văn A"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Số điện thoại liên hệ <span style={{color: '#F14D5C'}}>*</span></label>
              <input 
                type="tel" 
                name="phone" 
                value={shippingInfo.phone} 
                onChange={handleInputChange}
                placeholder="Ví dụ: 0987654321"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Địa chỉ giao hàng chính xác <span style={{color: '#F14D5C'}}>*</span></label>
              <input 
                type="text" 
                name="address" 
                value={shippingInfo.address} 
                onChange={handleInputChange}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Ghi chú cho đơn hàng (Tùy chọn)</label>
              <textarea 
                name="notes" 
                value={shippingInfo.notes} 
                onChange={handleInputChange}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                style={{...styles.input, height: '80px', resize: 'none', padding: '12px'}}
              />
            </div>

            {/* TÙY CHỌN YÊU CẦU XUẤT HÓA ĐƠN CÔNG TY */}
            <div style={{...styles.paymentMethodCard, backgroundColor: '#FFFDF0', borderColor: '#F5B041'}}>
              <div style={styles.radioRow}>
                <input 
                  type="checkbox" 
                  id="needInvoice" 
                  checked={needInvoice} 
                  onChange={(e) => setNeedInvoice(e.target.checked)} 
                  style={{accentColor: '#F5B041', width: '16px', height: '16px', cursor: 'pointer'}}
                />
                <label htmlFor="needInvoice" style={{fontSize: '14px', fontWeight: '700', color: '#B7950B', cursor: 'pointer'}}>
                  Tôi muốn yêu cầu xuất hóa đơn công ty (Invoice)
                </label>
              </div>

              {needInvoice && (
                <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div style={styles.inputGroup}>
                    <label style={{...styles.label, color: '#B7950B'}}>Mã số thuế <span style={{color: '#F14D5C'}}>*</span></label>
                    <input 
                      type="text" 
                      name="taxId" 
                      value={billingInfo.taxId} 
                      onChange={handleBillingChange} 
                      placeholder="Nhập mã số thuế công ty..." 
                      style={styles.input} 
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={{...styles.label, color: '#B7950B'}}>Tên công ty / Đơn vị <span style={{color: '#F14D5C'}}>*</span></label>
                    <input 
                      type="text" 
                      name="billingName" 
                      value={billingInfo.billingName} 
                      onChange={handleBillingChange} 
                      placeholder="Nhập tên công ty ghi trên hóa đơn..." 
                      style={styles.input} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={styles.paymentMethodCard}>
              <h4 style={{margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#2C3E50'}}>💵 Phương thức thanh toán</h4>
              <div style={styles.radioRow}>
                <input type="radio" id="cod" name="payment" defaultChecked style={{accentColor: '#F14D5C'}} />
                <label htmlFor="cod" style={{fontSize: '14px', fontWeight: '600', color: '#34495E', cursor: 'pointer'}}>
                  Thanh toán khi nhận hàng (COD)
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG & NÚT ĐẶT HÀNG */}
        <div style={styles.summarySection}>
          <h3 style={styles.sectionHeader}>📋 Đơn hàng của bạn ({cartItems.length})</h3>
          
          <div style={styles.itemsList}>
            {cartItems.map(item => (
              <div key={item.id} style={styles.itemRow}>
                <img src={item.cover_image || 'https://via.placeholder.com/50x70?text=Book'} alt={item.title} style={styles.itemImg} />
                <div style={styles.itemMeta}>
                  <h4 style={styles.itemTitle}>{item.title}</h4>
                  <span style={styles.itemQtyPrice}>Số lượng: {item.quantity} x {Number(item.price).toLocaleString('vi-VN')}đ</span>
                </div>
                <span style={styles.itemSubtotal}>{(Number(item.price) * item.quantity).toLocaleString('vi-VN')} đ</span>
              </div>
            ))}
          </div>

          <div style={styles.billWrapper}>
            <div style={styles.billRow}><span style={styles.billLabel}>Tạm tính:</span><span style={styles.billVal}>{tempSubtotal.toLocaleString('vi-VN')} đ</span></div>
            <div style={styles.billRow}><span style={styles.billLabel}>Thuế áp dụng:</span><span style={styles.billVal}>{totalTax.toLocaleString('vi-VN')} đ</span></div>
            <div style={styles.billRow}>
              <span style={styles.billLabel}>Phí vận chuyển:</span>
              <span style={styles.billVal}>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} đ`}</span>
            </div>
            {shippingFee > 0 && <p style={styles.shippingTip}>* Mua thêm {(300000 - tempSubtotal).toLocaleString('vi-VN')}đ để nhận Freeship!</p>}
            
            <div style={styles.divider}></div>
            
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>TỔNG CỘNG:</span>
              <span style={styles.totalVal}>{finalTotal.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <button type="button" onClick={handlePlaceOrder} style={styles.orderBtn}>
            🚀 XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= STYLESHEET CHUẨN ĐỒNG BỘ HIỆN ĐẠI =================
const styles = {
  container: { padding: '30px 4%', backgroundColor: '#F4F6F8', minHeight: '85vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '15px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #F14D5C', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#1A2530', marginBottom: '25px', letterSpacing: '0.5px' },
  checkoutGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px', alignItems: 'start' },
  infoSection: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  summarySection: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'sticky', top: '20px' },
  sectionHeader: { margin: '0 0 22px 0', fontSize: '16px', fontWeight: '800', color: '#2C3E50', borderLeft: '4px solid #F14D5C', paddingLeft: '10px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#566573' },
  input: { height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '14px', outline: 'none', color: '#2C3E50', transition: 'all 0.2s' },
  paymentMethodCard: { backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '10px', marginTop: '10px', border: '1px solid #EAECEE' },
  radioRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '240px', overflowY: 'auto', paddingRight: '5px', marginBottom: '20px' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #F2F4F5' },
  itemImg: { width: '45px', height: '60px', objectFit: 'contain', borderRadius: '4px' },
  itemMeta: { flex: 1 },
  itemTitle: { margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#2C3E50', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  itemQtyPrice: { fontSize: '12px', color: '#7F8C8D', display: 'block', marginTop: '2px' },
  itemSubtotal: { fontSize: '13.5px', fontWeight: '700', color: '#2C3E50' },
  billWrapper: { backgroundColor: '#FFF5F6', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #F14D5C' },
  billRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' },
  billLabel: { color: '#7F8C8D', fontWeight: '500' },
  billVal: { color: '#2C3E50', fontWeight: '600' },
  shippingTip: { margin: '-4px 0 10px 0', fontSize: '11.5px', color: '#F14D5C', fontStyle: 'italic', fontWeight: '600' },
  divider: { height: '1px', backgroundColor: '#ECC2C5', margin: '12px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: '14px', fontWeight: '800', color: '#1A2530' },
  totalVal: { fontSize: '22px', fontWeight: '800', color: '#F14D5C' },
  orderBtn: { width: '100%', marginTop: '20px', backgroundColor: '#F14D5C', color: '#ffffff', border: 'none', height: '48px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 20px rgba(241, 77, 92, 0.2)', transition: 'all 0.2s' }
};

export default CheckoutPage;