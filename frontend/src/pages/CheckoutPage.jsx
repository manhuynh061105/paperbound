import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services/api'; 
import { toast } from 'react-toastify';

const CheckoutPage = ({ refreshCartCount }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [infoMode, setInfoMode] = useState('profile');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // State quản lý Form giao hàng
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '', phone: '', address: '', notes: ''
  });

  // 📑 STATE QUẢN LÝ HÓA ĐƠN ĐỎ KIỂU FAHASA
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState('personal'); // 'personal' hoặc 'company'
  
  // gom toàn bộ các trường Fahasa yêu cầu
  const [billingInfo, setBillingInfo] = useState({
    buyerName: '',       // Họ tên người mua (Cá nhân + Doanh nghiệp)
    personalAddress: '', // Địa chỉ cá nhân
    idCard: '',          // CCCD / Hộ chiếu
    companyName: '',     // Tên doanh nghiệp
    companyAddress: '',  // Địa chỉ doanh nghiệp
    taxId: '',           // Mã số thuế
    qhnsCode: '',        // Mã đơn vị QHNS
    invoiceEmail: ''     // Email nhận hóa đơn
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
          toast.warning("🛒 Giỏ hàng của bạn đang trống!");
          navigate('/cart');
          return;
        }
        setCartItems(items);
      })
      .catch(err => {
        console.error(err);
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

  // Hàm cập nhật các trường hóa đơn lẻ
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      toast.warning("📋 Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }

    // Kiểm tra tính hợp lệ dữ liệu hóa đơn theo từng phân loại
    if (needInvoice) {
      if (!billingInfo.invoiceEmail) {
        toast.warning("✉️ Vui lòng nhập Email nhận hóa đơn!");
        return;
      }
      if (invoiceType === 'company') {
        if (!billingInfo.companyName || !billingInfo.companyAddress || !billingInfo.taxId) {
          toast.warning("🏢 Vui lòng điền đầy đủ Tên, Địa chỉ và Mã số thuế của Doanh nghiệp!");
          return;
        }
      }
    }

    try {
      // Đóng gói Payload gửi lên Backend bảo toàn các cấu trúc dữ liệu cũ
      const orderPayload = {
        userId: Number(userId),
        shippingAddress: `Tên: ${shippingInfo.fullName} - SĐT: ${shippingInfo.phone} - ĐC: ${shippingInfo.address}${shippingInfo.notes ? ` (Ghi chú: ${shippingInfo.notes})` : ''}`,
        paymentMethod: paymentMethod, 
        needInvoice: needInvoice,
        // Chuyển đổi thông minh về cấu trúc mà Backend cũ của bạn đang mong chờ để tránh lỗi
        billingInfo: needInvoice ? {
          taxId: invoiceType === 'company' ? billingInfo.taxId : billingInfo.idCard,
          billingName: invoiceType === 'company' ? billingInfo.companyName : (billingInfo.buyerName || shippingInfo.fullName),
          // Gửi kèm toàn bộ thông tin chi tiết kiểu Fahasa vào trường mở rộng
          extraMetadata: {
            invoiceType,
            ...billingInfo
          }
        } : null,
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
        setCreatedOrderId(response.data.orderId);
        if (refreshCartCount) refreshCartCount(); 

        if (paymentMethod === 'QR') {
          setIsQrModalOpen(true);
        } else {
          setIsSuccessModalOpen(true);
        }
      } else {
        toast.error("❌ Thất bại: " + response.data.message);
      }
    } catch (error) {
      toast.error("Đặt hàng thất bại: " + (error.response?.data?.message || error.message));
    }
  };

  const handleConfirmQrPaid = () => {
    setIsQrModalOpen(false);
    setIsSuccessModalOpen(true); 
  };

  // Hàm giả lập xuất/in file hóa đơn đỏ dạng PDF
  const handlePrintMockInvoice = () => {
    const title = invoiceType === 'company' ? 'HÓA ĐƠN ĐIỆN TỬ DOANH NGHIỆP' : 'HÓA ĐƠN ĐIỆN TỬ CÁ NHÂN';
    const targetName = invoiceType === 'company' ? billingInfo.companyName : (billingInfo.buyerName || shippingInfo.fullName);
    const targetId = invoiceType === 'company' ? billingInfo.taxId : billingInfo.idCard;

    alert(`
      --- 📝 ${title} PAPERBOUND ---
      Mã đơn hàng: #DH${createdOrderId}
      Đơn vị/Người mua: ${targetName}
      MST/CCCD: ${targetId || 'Không cung cấp'}
      Email nhận: ${billingInfo.invoiceEmail}
      -----------------------------------------
      Tổng tiền thanh toán (gồm VAT): ${finalTotal.toLocaleString('vi-VN')} đ
      👉 [Hệ thống đồ án]: Hóa đơn điện tử đã gửi về email ${billingInfo.invoiceEmail} thành công!
    `);
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
        {/* CỘT TRÁI - FORM NHẬP LIỆU */}
        <div style={styles.infoSection}>
          <h3 style={styles.sectionHeader}>🚚 Thông tin nhận hàng</h3>
          <div style={styles.switchBar}>
            <button type="button" style={infoMode === 'profile' ? styles.switchBtnActive : styles.switchBtn} onClick={() => setInfoMode('profile')}>👤 Dùng thông tin cá nhân</button>
            <button type="button" style={infoMode === 'manual' ? styles.switchBtnActive : styles.switchBtn} onClick={() => setInfoMode('manual')}>✍️ Nhập người nhận khác</button>
          </div>

          <form style={styles.form}>
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
              <textarea name="notes" value={shippingInfo.notes} onChange={handleInputChange} placeholder="Ví dụ: Giao giờ hành chính..." style={{...styles.input, height: '60px', resize: 'none', padding: '12px'}} />
            </div>

            {/* ================= KHU VỰC CẤU HÌNH HÓA ĐƠN KIỂU FAHASA ================= */}
            <div style={{...styles.paymentMethodCard, backgroundColor: '#FFFDF0', borderColor: '#F5B041'}}>
              <div style={styles.radioRow}>
                <input type="checkbox" id="needInvoice" checked={needInvoice} onChange={(e) => setNeedInvoice(e.target.checked)} style={{accentColor: '#F5B041', width: '16px', height: '16px', cursor: 'pointer'}} />
                <label htmlFor="needInvoice" style={{fontSize: '14px', fontWeight: '700', color: '#B7950B', cursor: 'pointer'}}>Tôi muốn yêu cầu xuất hóa đơn GTGT (Hóa đơn đỏ)</label>
              </div>

              {needInvoice && (
                <div style={{marginTop: '15px', borderTop: '1px dashed #F5B041', paddingTop: '15px'}}>
                  {/* Switch chọn loại hóa đơn */}
                  <div style={{...styles.switchBar, backgroundColor: '#FEF9E7', marginBottom: '15px'}}>
                    <button type="button" style={invoiceType === 'personal' ? styles.invoiceTabActive : styles.invoiceTab} onClick={() => setInvoiceType('personal')}>🧍 Hóa đơn Cá nhân</button>
                    <button type="button" style={invoiceType === 'company' ? styles.invoiceTabActive : styles.invoiceTab} onClick={() => setInvoiceType('company')}>🏢 Hóa đơn Doanh nghiệp</button>
                  </div>

                  {/* FORM HÓA ĐƠN CÁ NHÂN */}
                  {invoiceType === 'personal' && (
                    <div style={styles.invoiceFormGrid}>
                      <input type="text" name="buyerName" value={billingInfo.buyerName} onChange={handleBillingChange} placeholder="Họ tên người mua hàng (Tùy chọn)" style={styles.input} />
                      <input type="text" name="personalAddress" value={billingInfo.personalAddress} onChange={handleBillingChange} placeholder="Địa chỉ cá nhân (Tùy chọn)" style={styles.input} />
                      <input type="text" name="idCard" value={billingInfo.idCard} onChange={handleBillingChange} placeholder="Số CCCD / Hộ chiếu (Tùy chọn)" style={styles.input} />
                      <input type="email" name="invoiceEmail" value={billingInfo.invoiceEmail} onChange={handleBillingChange} placeholder="Email nhận hóa đơn gốc (Bắt buộc) *" style={{...styles.input, borderColor: '#F14D5C'}} required />
                    </div>
                  )}

                  {/* FORM HÓA ĐƠN DOANH NGHIỆP */}
                  {invoiceType === 'company' && (
                    <div style={styles.invoiceFormGrid}>
                      <input type="text" name="buyerName" value={billingInfo.buyerName} onChange={handleBillingChange} placeholder="Họ tên người mua hàng (Tùy chọn)" style={styles.input} />
                      <input type="text" name="companyName" value={billingInfo.companyName} onChange={handleBillingChange} placeholder="Tên doanh nghiệp viết chính xác * " style={{...styles.input, borderColor: '#F14D5C'}} required />
                      <input type="text" name="companyAddress" value={billingInfo.companyAddress} onChange={handleBillingChange} placeholder="Địa chỉ doanh nghiệp đăng ký * " style={{...styles.input, borderColor: '#F14D5C'}} required />
                      <input type="text" name="taxId" value={billingInfo.taxId} onChange={handleBillingChange} placeholder="Mã số thuế doanh nghiệp (MST) * " style={{...styles.input, borderColor: '#F14D5C'}} required />
                      <input type="text" name="qhnsCode" value={billingInfo.qhnsCode} onChange={handleBillingChange} placeholder="Mã đơn vị QHNS (Tùy chọn)" style={styles.input} />
                      <input type="email" name="invoiceEmail" value={billingInfo.invoiceEmail} onChange={handleBillingChange} placeholder="Email nhận hóa đơn cơ quan (Bắt buộc) *" style={{...styles.input, borderColor: '#F14D5C'}} required />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LỰA CHỌN PHƯƠNG THỨC THANH TOÁN */}
            <div style={styles.paymentMethodCard}>
              <h4 style={{margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#2C3E50'}}>💵 Phương thức thanh toán</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{...styles.paymentOption, borderColor: paymentMethod === 'COD' ? '#F14D5C' : '#EAECEE'}} onClick={() => setPaymentMethod('COD')}>
                  <input type="radio" id="cod" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{accentColor: '#F14D5C'}} />
                  <label htmlFor="cod" style={{fontWeight: '600', color: '#34495E', cursor: 'pointer', flex: 1}}>📦 Thanh toán khi nhận hàng (COD)</label>
                </div>
                <div style={{...styles.paymentOption, borderColor: paymentMethod === 'QR' ? '#F14D5C' : '#EAECEE'}} onClick={() => setPaymentMethod('QR')}>
                  <input type="radio" id="qr" name="payment" checked={paymentMethod === 'QR'} onChange={() => setPaymentMethod('QR')} style={{accentColor: '#F14D5C'}} />
                  <label htmlFor="qr" style={{fontWeight: '600', color: '#34495E', cursor: 'pointer', flex: 1}}>📱 Chuyển khoản nhanh qua mã QR (VietQR tự động)</label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI - TÓM TẮT ĐƠN HÀNG */}
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

      {/* MODAL 1: MÃ QR THANH TOÁN */}
      {isQrModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '440px', textAlign: 'center', position: 'relative'}}>
            <button type="button" onClick={() => setIsQrModalOpen(false)} style={styles.closeModalXBtn}>&times;</button>
            <h3 style={{margin: '0 0 5px 0', color: '#2C3E50', fontWeight: 'bold'}}>QUÉT MÃ VIETQR ĐỂ THANH TOÁN</h3>
            <div style={styles.qrWrapper}>
              <img src={`https://img.vietqr.io/image/970422-0987654321-compact2.jpg?amount=${finalTotal}&addInfo=DH${createdOrderId || 'PAY'}&accountName=DU%20AN%20DO%20AN%20APP`} alt="VietQR" style={styles.qrImage} />
            </div>
            <div style={styles.qrInfoTable}>
              <div style={styles.qrInfoRow}><span>Số tiền:</span><b style={{color: '#F14D5C'}}>{finalTotal.toLocaleString('vi-VN')} đ</b></div>
              <div style={styles.qrInfoRow}><span>Nội dung CK:</span><b style={{color: '#2e86de'}}>DH{createdOrderId}</b></div>
            </div>
            <button onClick={handleConfirmQrPaid} style={styles.modalSubmitBtn}>✅ Tôi đã chuyển khoản thành công</button>
          </div>
        </div>
      )}

      {/* MODAL 2: POP-UP THÀNH CÔNG (TÍCH HỢP XEM HÓA ĐƠN) */}
      {isSuccessModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '480px', textAlign: 'center', padding: '40px 30px'}}>
            <div style={{fontSize: '65px', marginBottom: '15px'}}>🎉</div>
            <h2 style={{color: '#F14D5C', margin: '0 0 12px 0', fontWeight: '800'}}>CẢM ƠN BẠN ĐẠ ĐẶT HÀNG!</h2>
            <p style={{color: '#2C3E50', fontWeight: '600', fontSize: '15px'}}>Đơn hàng #{createdOrderId} đã được ghi nhận.</p>
            <p style={{color: '#7f8c8d', fontSize: '13px', lineHeight: '1.5', marginBottom: '25px'}}>
              Hệ thống đang kiểm kho và đóng gói sách. Hành trình vận chuyển đơn hàng sẽ được cập nhật liên tục tại trang Lịch sử.
            </p>

            {/* ⚡️ NÚT IN HOẶC XEM HÓA ĐƠN CHO ĐỒ ÁN THÊM ĐIỂM CỘNG */}
            {needInvoice && (
              <div style={{ marginBottom: '25px', padding: '12px', backgroundColor: '#F4F6F8', borderRadius: '8px', border: '1px solid #EAECEE' }}>
                <p style={{ fontSize: '12.5px', color: '#27ae60', margin: '0 0 10px 0', fontWeight: '600' }}>🔒 Bạn đã đăng ký xuất hóa đơn tài chính cho đơn hàng này</p>
                <button type="button" onClick={handlePrintMockInvoice} style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  📄 Xem & Kiểm tra Hóa Đơn Đỏ (GTGT)
                </button>
              </div>
            )}
            
            <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={() => navigate('/')} style={styles.backHomeBtn}>🏠 Về trang chủ</button>
              <button onClick={() => navigate('/orders-history')} style={styles.viewOrdersBtn}>📦 Xem lịch sử đơn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= STYLESHEET CẢI TIẾN =================
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
  
  // Tabs hóa đơn mở rộng
  invoiceTab: { flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent', color: '#9a7d0a', fontSize: '12.5px', fontWeight: '600' },
  invoiceTabActive: { flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#F5B041', color: '#fff', fontSize: '12.5px', fontWeight: 'bold' },
  invoiceFormGrid: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' },

  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#566573' },
  input: { height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '14px', outline: 'none', color: '#2C3E50', backgroundColor: '#fff' },
  paymentMethodCard: { backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '10px', marginTop: '10px', border: '1px solid #EAECEE' },
  paymentOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #EAECEE', cursor: 'pointer' },
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
  closeModalXBtn: { position: 'absolute', top: '15px', right: '20px', backgroundColor: 'transparent', border: 'none', fontSize: '28px', color: '#95a5a6', cursor: 'pointer' },

  backHomeBtn: { flex: 1, padding: '13px', backgroundColor: '#f5f6fa', color: '#57606f', border: '1px solid #dcdde1', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
  viewOrdersBtn: { flex: 1, padding: '13px', backgroundColor: '#F14D5C', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(241,77,92,0.2)' }
};

export default CheckoutPage;