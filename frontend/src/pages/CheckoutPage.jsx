import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services/api'; 
import { toast } from 'react-toastify';

const CheckoutPage = ({ refreshCartCount }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái Switchbar thông tin người nhận
  const [infoMode, setInfoMode] = useState('profile');

  // 💳 PHƯƠNG THỨC THANH TOÁN: 'COD' hoặc 'QR'
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Quản lý các Modal trạng thái
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // State quản lý Form thông tin khách hàng
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: ''
  });

  // State phục vụ cho phần kiểm tra xuất hóa đơn đỏ (Invoice)
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

  useEffect(() => {
    if (infoMode === 'profile' && savedUser) {
      setShippingInfo({
        fullName: savedUser.fullName || savedUser.username || savedUser.name || '',
        phone: savedUser.phone || '',
        address: savedUser.address || '',
        notes: ''
      });
    } else if (infoMode === 'manual') {
      setShippingInfo({ fullName: '', phone: '', address: '', notes: '' });
    }
  }, [infoMode]);

  // ⏱️ GIẢ LẬP REAL-TIME CHO ĐỒ ÁN: Tự động nhận diện thanh toán sau 6 giây quét QR
  useEffect(() => {
    let timer;
    if (isQrModalOpen) {
      timer = setTimeout(() => {
        toast.success("💸 Hệ thống đã nhận được tiền! Đang xử lý đơn hàng...");
        handleConfirmQrPaid();
      }, 6000);
    }
    return () => clearTimeout(timer);
  }, [isQrModalOpen]);

  // Tính toán tiền bạc
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

  // Hàm xử lý gửi đơn hàng lên Server Backend
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
      const orderPayload = {
        userId: Number(userId),
        shippingAddress: `Tên: ${shippingInfo.fullName} - SĐT: ${shippingInfo.phone} - ĐC: ${shippingInfo.address}${shippingInfo.notes ? ` (Ghi chú: ${shippingInfo.notes})` : ''}`,
        paymentMethod: paymentMethod, 
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

      const response = await orderService.create(orderPayload);

      if (response.data.success) {
        const orderIdFromBE = response.data.orderId;
        setCreatedOrderId(orderIdFromBE);

        if (refreshCartCount) refreshCartCount(); 

        // Nếu chọn QR -> Bật màn hình quét mã QR mô phỏng lên trước
        if (paymentMethod === 'QR') {
          setIsQrModalOpen(true);
        } else {
          // Nếu chọn COD -> Bật thẳng màn hình cảm ơn thành công
          setIsSuccessModalOpen(true);
        }
      } else {
        toast.error("❌ Thất bại: " + response.data.message);
      }

    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error("Đặt hàng thất bại: " + errorMsg);
    }
  };

  // Xác nhận đã thanh toán xong ở màn hình QR mô phỏng
  const handleConfirmQrPaid = () => {
    setIsQrModalOpen(false);
    setIsSuccessModalOpen(true); 
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
        {/* CỘT TRÁI */}
        <div style={styles.infoSection}>
          <h3 style={styles.sectionHeader}>🚚 Thông tin nhận hàng</h3>
          <div style={styles.switchBar}>
            <button type="button" style={infoMode === 'profile' ? styles.switchBtnActive : styles.switchBtn} onClick={() => setInfoMode('profile')}>👤 Dùng thông tin cá nhân</button>
            <button type="button" style={infoMode === 'manual' ? styles.switchBtnActive : styles.switchBtn} onClick={() => setInfoMode('manual')}>✍️ Nhập người nhận khác</button>
          </div>

          <form style={styles.form}>
            {/* Các Input thông tin */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Họ và tên người nhận <span style={{color: '#F14D5C'}}>*</span></label>
              <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="Ví dụ: Nguyễn Văn A" style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Số điện thoại liên hệ <span style={{color: '#F14D5C'}}>*</span></label>
              <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Ví dụ: 0987654321" style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Địa chỉ giao hàng chính xác <span style={{color: '#F14D5C'}}>*</span></label>
              <input type="text" name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Số nhà, tên đường..." style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Ghi chú cho đơn hàng (Tùy chọn)</label>
              <textarea name="notes" value={shippingInfo.notes} onChange={handleInputChange} placeholder="Ví dụ: Giao giờ hành chính..." style={{...styles.input, height: '70px', resize: 'none', padding: '12px'}} />
            </div>

            {/* Hóa đơn công ty */}
            <div style={{...styles.paymentMethodCard, backgroundColor: '#FFFDF0', borderColor: '#F5B041'}}>
              <div style={styles.radioRow}>
                <input type="checkbox" id="needInvoice" checked={needInvoice} onChange={(e) => setNeedInvoice(e.target.checked)} style={{accentColor: '#F5B041', width: '16px', height: '16px', cursor: 'pointer'}} />
                <label htmlFor="needInvoice" style={{fontSize: '14px', fontWeight: '700', color: '#B7950B', cursor: 'pointer'}}>Tôi muốn yêu cầu xuất hóa đơn công ty (Invoice)</label>
              </div>
              {needInvoice && (
                <div style={{marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <input type="text" name="taxId" value={billingInfo.taxId} onChange={handleBillingChange} placeholder="Nhập mã số thuế công ty..." style={styles.input} />
                  <input type="text" name="billingName" value={billingInfo.billingName} onChange={handleBillingChange} placeholder="Nhập tên công ty..." style={styles.input} />
                </div>
              )}
            </div>

            {/* LỰA CHỌN PHƯƠNG THỨC THANH TOÁN */}
            <div style={styles.paymentMethodCard}>
              <h4 style={{margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#2C3E50'}}>💵 Phương thức thanh toán</h4>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{...styles.paymentOption, borderColor: paymentMethod === 'COD' ? '#F14D5C' : '#EAECEE'}} onClick={() => setPaymentMethod('COD')}>
                  {/* Đã sửa đóng ngoặc tròn ) ở dòng này */}
                  <input type="radio" id="cod" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{accentColor: '#F14D5C'}} />
                  <label htmlFor="cod" style={{fontWeight: '600', color: '#34495E', cursor: 'pointer', flex: 1}}>
                    📦 Thanh toán khi nhận hàng (COD)
                  </label>
                </div>

                <div style={{...styles.paymentOption, borderColor: paymentMethod === 'QR' ? '#F14D5C' : '#EAECEE'}} onClick={() => setPaymentMethod('QR')}>
                  <input type="radio" id="qr" name="payment" checked={paymentMethod === 'QR'} onChange={() => setPaymentMethod('QR')} style={{accentColor: '#F14D5C'}} />
                  <label htmlFor="qr" style={{fontWeight: '600', color: '#34495E', cursor: 'pointer', flex: 1}}>
                    📱 Chuyển khoản nhanh qua mã QR (VietQR tự động)
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI */}
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
            <div style={styles.billRow}><span style={styles.billLabel}>Phí vận chuyển:</span><span style={styles.billVal}>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} đ`}</span></div>
            <div style={styles.divider}></div>
            <div style={styles.totalRow}><span style={styles.totalLabel}>TỔNG CỘNG:</span><span style={styles.totalVal}>{finalTotal.toLocaleString('vi-VN')} đ</span></div>
          </div>

          <button type="button" onClick={handlePlaceOrder} style={styles.orderBtn}>
            🚀 XÁC NHẬN ĐẶT HÀNG NGAY
          </button>
        </div>
      </div>

      {/* ================= MODAL 1: MÃ QR THANH TOÁN MÔ PHỎNG (CÓ NÚT X) ================= */}
      {isQrModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '440px', textAlign: 'center', position: 'relative'}}>
            
            {/* ❌ NÚT "X" ĐỂ TẮT HOÀN TOÀN THÔNG BÁO THEO YÊU CẦU */}
            <button 
              type="button" 
              onClick={() => setIsQrModalOpen(false)} 
              style={styles.closeModalXBtn}
              title="Đóng cửa sổ"
            >
              &times;
            </button>

            <h3 style={{margin: '0 0 5px 0', color: '#2C3E50', fontWeight: 'bold'}}>QUÉT MÃ VIETQR ĐỂ THANH TOÁN</h3>
            <p style={{fontSize: '13px', color: '#7f8c8d', margin: '0 0 15px 0'}}>Sử dụng ứng dụng ngân hàng hoặc ví điện tử bất kỳ để quét mã</p>
            
            <div style={styles.qrWrapper}>
              <img 
                src={`https://img.vietqr.io/image/970422-0987654321-compact2.jpg?amount=${finalTotal}&addInfo=DH${createdOrderId || 'PAY'}&accountName=DU%20AN%20DO%20AN%20APP`} 
                alt="VietQR Payment" 
                style={styles.qrImage} 
              />
            </div>

            <div style={styles.qrInfoTable}>
              <div style={styles.qrInfoRow}><span>Ngân hàng:</span><b>MB Bank (Quân Đội)</b></div>
              <div style={styles.qrInfoRow}><span>Số tiền:</span><b style={{color: '#F14D5C'}}>{finalTotal.toLocaleString('vi-VN')} đ</b></div>
              <div style={styles.qrInfoRow}><span>Nội dung chuyển khoản:</span><b style={{color: '#2e86de'}}>DH{createdOrderId}</b></div>
            </div>

            <p style={styles.demoWarning}>⚠️ <b>Lưu ý đồ án:</b> Đây là cổng thanh toán mô phỏng sandbox phục vụ chấm điểm chấm đồ án.</p>
            
            <button onClick={handleConfirmQrPaid} style={styles.modalSubmitBtn}>
              ✅ Tôi đã chuyển khoản thành công
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: POP-UP CẢM ƠN KHÁCH HÀNG ================= */}
      {isSuccessModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '460px', textAlign: 'center', padding: '40px 30px'}}>
            <div style={{fontSize: '65px', marginBottom: '15px'}}>🎉</div>
            <h2 style={{color: '#F14D5C', margin: '0 0 12px 0', fontWeight: '800', letterSpacing: '0.3px'}}>CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!</h2>
            <p style={{color: '#2C3E50', fontWeight: '600', fontSize: '15px', margin: '0 0 8px 0'}}>Đơn hàng #{createdOrderId} của bạn đã được ghi nhận thành công.</p>
            <p style={{color: '#7f8c8d', fontSize: '13.5px', lineHeight: '1.5', margin: '0 0 30px 0'}}>
              Hệ thống đang tiến hành bốc tách dữ liệu và chuẩn bị bàn giao cho đơn vị vận chuyển. Bạn có thể kiểm tra hành trình đơn hàng trong mục Lịch sử bất cứ lúc nào.
            </p>
            
            <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={() => navigate('/')} style={styles.backHomeBtn}>
                🏠 Về trang chủ
              </button>
              <button onClick={() => navigate('/orders-history')} style={styles.viewOrdersBtn}>
                📦 Xem lịch sử đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= STYLESHEET =================
const styles = {
  container: { padding: '30px 4%', backgroundColor: '#F4F6F8', minHeight: '85vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '15px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #F14D5C', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#1A2530', marginBottom: '25px', letterSpacing: '0.5px' },
  checkoutGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px', alignItems: 'start' },
  infoSection: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  summarySection: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'sticky', top: '20px' },
  sectionHeader: { margin: '0 0 22px 0', fontSize: '16px', fontWeight: '800', color: '#2C3E50', borderLeft: '4px solid #F14D5C', paddingLeft: '10px' },
  
  switchBar: { display: 'flex', backgroundColor: '#F4F6F8', padding: '5px', borderRadius: '10px', marginBottom: '25px', gap: '5px' },
  switchBtn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent', color: '#7f8c8d', fontSize: '13.5px', fontWeight: '600' },
  switchBtnActive: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#F14D5C', color: '#fff', fontSize: '13.5px', fontWeight: 'bold', boxShadow: '0 3px 10px rgba(241,77,92,0.2)' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#566573' },
  input: { height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '14px', outline: 'none', color: '#2C3E50' },
  paymentMethodCard: { backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '10px', marginTop: '10px', border: '1px solid #EAECEE' },
  paymentOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #EAECEE', cursor: 'pointer', transition: 'all 0.2s' },
  radioRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  
  itemsList: { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '240px', overflowY: 'auto', paddingRight: '5px', marginBottom: '20px' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #F2F4F5' },
  itemImg: { width: '45px', height: '60px', objectFit: 'contain', borderRadius: '4px' },
  itemMeta: { flex: 1 },
  itemTitle: { margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#2C3E50' },
  itemQtyPrice: { fontSize: '12px', color: '#7F8C8D', display: 'block', marginTop: '2px' },
  itemSubtotal: { fontSize: '13.5px', fontWeight: '700', color: '#2C3E50' },
  billWrapper: { backgroundColor: '#FFF5F6', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #F14D5C' },
  billRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' },
  billLabel: { color: '#7F8C8D', fontWeight: '500' },
  billVal: { color: '#2C3E50', fontWeight: '600' },
  divider: { height: '1px', backgroundColor: '#ECC2C5', margin: '12px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: '14px', fontWeight: '800', color: '#1A2530' },
  totalVal: { fontSize: '22px', fontWeight: '800', color: '#F14D5C' },
  orderBtn: { width: '100%', marginTop: '20px', backgroundColor: '#F14D5C', color: '#ffffff', border: 'none', height: '48px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 20px rgba(241, 77, 92, 0.2)' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(44, 62, 80, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '92%', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' },
  qrWrapper: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', display: 'inline-block', margin: '10px 0 20px 0', border: '1px solid #eef2f5' },
  qrImage: { width: '220px', height: '220px', objectFit: 'contain' },
  qrInfoTable: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '13.5px' },
  qrInfoRow: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e8e8e8', paddingBottom: '6px' },
  demoWarning: { fontSize: '12px', color: '#e67e22', fontStyle: 'italic', margin: '0 0 20px 0' },
  modalSubmitBtn: { width: '100%', padding: '12px', backgroundColor: '#F14D5C', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(241,77,92,0.2)' },
  
  // Style nút X đóng Modal QR
  closeModalXBtn: { position: 'absolute', top: '15px', right: '20px', backgroundColor: 'transparent', border: 'none', fontSize: '28px', color: '#95a5a6', cursor: 'pointer', transition: 'color 0.2s', outline: 'none', lineHeight: '1' },

  backHomeBtn: { flex: 1, padding: '13px', backgroundColor: '#f5f6fa', color: '#57606f', border: '1px solid #dcdde1', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
  viewOrdersBtn: { flex: 1, padding: '13px', backgroundColor: '#F14D5C', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(241,77,92,0.2)' }
};

export default CheckoutPage;