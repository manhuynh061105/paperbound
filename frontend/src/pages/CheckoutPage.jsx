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
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '', phone: '', address: '', notes: ''
  });

  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState('personal'); 
  
  const [billingInfo, setBillingInfo] = useState({
    buyerName: '',       
    personalAddress: '', 
    idCard: '',          
    companyName: '',     
    companyAddress: '',  
    taxId: '',           
    qhnsCode: '',        
    invoiceEmail: ''     
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
      toast.warning("📋 Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }

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
      const orderPayload = {
        userId: Number(userId),
        shippingAddress: `Tên: ${shippingInfo.fullName} - SĐT: ${shippingInfo.phone} - ĐC: ${shippingInfo.address}${shippingInfo.notes ? ` (Ghi chú: ${shippingInfo.notes})` : ''}`,
        paymentMethod: paymentMethod, 
        needInvoice: needInvoice,
        billingInfo: needInvoice ? {
          taxId: invoiceType === 'company' ? billingInfo.taxId : billingInfo.idCard,
          billingName: invoiceType === 'company' ? billingInfo.companyName : (billingInfo.buyerName || shippingInfo.fullName),
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

  const handlePrintMockInvoice = () => {
    setIsInvoiceModalOpen(true);
  };

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748B', fontWeight: '500' }}>Đang chuẩn bị hóa đơn thanh toán thực tế...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>💳 TIẾN HÀNH THANH TOÁN</h2>
      
      <div style={styles.checkoutGrid}>
        <div style={styles.infoSection}>
          <h3 style={styles.sectionHeader}>🚚 Thông tin nhận hàng</h3>
          <div style={styles.switchBar}>
            <button type="button" style={infoMode === 'profile' ? styles.switchBtnActive : styles.switchBtn} onClick={() => setInfoMode('profile')}>👤 Dùng thông tin cá nhân</button>
            <button type="button" style={infoMode === 'manual' ? styles.switchBtnActive : styles.switchBtn} onClick={() => setInfoMode('manual')}>✍️ Nhập người nhận khác</button>
          </div>

          <form style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Họ và tên người nhận <span style={{color: '#E67E22'}}>*</span></label>
              <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="Ví dụ: Nguyễn Văn A" style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Số điện thoại liên hệ <span style={{color: '#E67E22'}}>*</span></label>
              <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Ví dụ: 0987654321" style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Địa chỉ giao hàng chính xác <span style={{color: '#E67E22'}}>*</span></label>
              <input type="text" name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Số nhà, tên đường..." style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Ghi chú cho đơn hàng (Tùy chọn)</label>
              <textarea name="notes" value={shippingInfo.notes} onChange={handleInputChange} placeholder="Ví dụ: Giao giờ hành chính..." style={{...styles.input, height: '70px', resize: 'none', padding: '12px'}} />
            </div>

            <div style={styles.invoiceCard}>
              <div style={styles.radioRow}>
                <input type="checkbox" id="needInvoice" checked={needInvoice} onChange={(e) => setNeedInvoice(e.target.checked)} style={styles.checkbox} />
                <label htmlFor="needInvoice" style={styles.invoiceLabel}>Tôi muốn yêu cầu xuất hóa đơn GTGT (Hóa đơn đỏ)</label>
              </div>

              {needInvoice && (
                <div style={styles.invoiceSubSection}>
                  <div style={styles.invoiceTabsBar}>
                    <button type="button" style={invoiceType === 'personal' ? styles.invoiceTabActive : styles.invoiceTab} onClick={() => setInvoiceType('personal')}>🧍 Hóa đơn Cá nhân</button>
                    <button type="button" style={invoiceType === 'company' ? styles.invoiceTabActive : styles.invoiceTab} onClick={() => setInvoiceType('company')}>🏢 Hóa đơn Doanh nghiệp</button>
                  </div>

                  {invoiceType === 'personal' && (
                    <div style={styles.invoiceFormGrid}>
                      <input type="text" name="buyerName" value={billingInfo.buyerName} onChange={handleBillingChange} placeholder="Họ tên người mua hàng (Tùy chọn)" style={styles.input} />
                      <input type="text" name="personalAddress" value={billingInfo.personalAddress} onChange={handleBillingChange} placeholder="Địa chỉ cá nhân (Tùy chọn)" style={styles.input} />
                      <input type="text" name="idCard" value={billingInfo.idCard} onChange={handleBillingChange} placeholder="Số CCCD / Hộ chiếu (Tùy chọn)" style={styles.input} />
                      <input type="email" name="invoiceEmail" value={billingInfo.invoiceEmail} onChange={handleBillingChange} placeholder="Email nhận hóa đơn gốc (Bắt buộc) *" style={styles.inputRequired} required />
                    </div>
                  )}

                  {invoiceType === 'company' && (
                    <div style={styles.invoiceFormGrid}>
                      <input type="text" name="buyerName" value={billingInfo.buyerName} onChange={handleBillingChange} placeholder="Họ tên người mua hàng (Tùy chọn)" style={styles.input} />
                      <input type="text" name="companyName" value={billingInfo.companyName} onChange={handleBillingChange} placeholder="Tên doanh nghiệp viết chính xác * " style={styles.inputRequired} required />
                      <input type="text" name="companyAddress" value={billingInfo.companyAddress} onChange={handleBillingChange} placeholder="Địa chỉ doanh nghiệp đăng ký * " style={styles.inputRequired} required />
                      <input type="text" name="taxId" value={billingInfo.taxId} onChange={handleBillingChange} placeholder="Mã số thuế doanh nghiệp (MST) * " style={styles.inputRequired} required />
                      <input type="text" name="qhnsCode" value={billingInfo.qhnsCode} onChange={handleBillingChange} placeholder="Mã đơn vị QHNS (Tùy chọn)" style={styles.input} />
                      <input type="email" name="invoiceEmail" value={billingInfo.invoiceEmail} onChange={handleBillingChange} placeholder="Email nhận hóa đơn cơ quan (Bắt buộc) *" style={styles.inputRequired} required />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.paymentMethodCard}>
              <h4 style={styles.paymentMethodTitle}>💵 Phương thức thanh toán</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{...styles.paymentOption, borderColor: paymentMethod === 'COD' ? '#E67E22' : '#E2E8F0', backgroundColor: paymentMethod === 'COD' ? '#FDF6F0' : '#ffffff'}} onClick={() => setPaymentMethod('COD')}>
                  <input type="radio" id="cod" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{accentColor: '#E67E22', cursor: 'pointer'}} />
                  <label htmlFor="cod" style={{fontWeight: '600', color: '#2C3E50', cursor: 'pointer', flex: 1, fontSize: '14px'}}>📦 Thanh toán khi nhận hàng (COD)</label>
                </div>
                <div style={{...styles.paymentOption, borderColor: paymentMethod === 'QR' ? '#E67E22' : '#E2E8F0', backgroundColor: paymentMethod === 'QR' ? '#FDF6F0' : '#ffffff'}} onClick={() => setPaymentMethod('QR')}>
                  <input type="radio" id="qr" name="payment" checked={paymentMethod === 'QR'} onChange={() => setPaymentMethod('QR')} style={{accentColor: '#E67E22', cursor: 'pointer'}} />
                  <label htmlFor="qr" style={{fontWeight: '600', color: '#2C3E50', cursor: 'pointer', flex: 1, fontSize: '14px'}}>📱 Chuyển khoản nhanh qua mã QR (VietQR tự động)</label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div style={styles.summarySection}>
          <h3 style={styles.sectionHeader}>📋 Đơn hàng của bạn ({cartItems.length})</h3>
          <div style={styles.itemsList}>
            {cartItems.map(item => (
              <div key={item.id || item.product_id} style={styles.itemRow}>
                <img src={item.cover_image || 'https://via.placeholder.com/50x70?text=Book'} alt={item.title} style={styles.itemImg} />
                <div style={styles.itemMeta}>
                  <h4 style={styles.itemTitle}>{item.title}</h4>
                  <span style={styles.itemQtyPrice}>Số lượng: {item.quantity} x {Number(item.price).toLocaleString('vi-VN')}đ</span>
                </div>
                <span style={styles.itemSubtotalText}>{(Number(item.price) * item.quantity).toLocaleString('vi-VN')} đ</span>
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

      {isQrModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentQr}>
            <button type="button" onClick={() => setIsQrModalOpen(false)} style={styles.closeModalXBtn}>&times;</button>
            <h3 style={styles.modalQrTitle}>QUÉT MÃ VIETQR ĐỂ THANH TOÁN</h3>
            <div style={styles.qrWrapper}>
              <img src={`https://img.vietqr.io/image/970422-0987654321-compact2.jpg?amount=${finalTotal}&addInfo=DH${createdOrderId || 'PAY'}&accountName=DU%20AN%20DO%20AN%20APP`} alt="VietQR" style={styles.qrImage} />
            </div>
            <div style={styles.qrInfoTable}>
              <div style={styles.qrInfoRow}><span>Số tiền:</span><b style={{color: '#E67E22'}}>{finalTotal.toLocaleString('vi-VN')} đ</b></div>
              <div style={styles.qrInfoRow}><span>Nội dung CK:</span><b style={{color: '#2C3E50'}}>DH{createdOrderId}</b></div>
            </div>
            <button onClick={handleConfirmQrPaid} style={styles.modalSubmitBtn}>✅ Tôi đã chuyển khoản thành công</button>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentSuccess}>
            <div style={styles.successIcon}>🎉</div>
            <h2 style={styles.successTitle}>CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!</h2>
            <p style={styles.successOrderText}>Đơn hàng #{createdOrderId} đã được ghi nhận.</p>
            <p style={styles.successSubText}>
              Hệ thống đang kiểm kho và đóng gói sách. Hành trình vận chuyển đơn hàng sẽ được cập nhật liên tục tại trang Lịch sử.
            </p>

            {needInvoice && (
              <div style={styles.invoicePrintBox}>
                <p style={styles.invoicePrintStatus}>🔒 Bạn đã đăng ký xuất hóa đơn tài chính cho đơn hàng này</p>
                <button type="button" onClick={handlePrintMockInvoice} style={styles.printBtn}>
                  📄 Xem & Kiểm tra Hóa Đơn Đỏ (GTGT)
                </button>
              </div>
            )}
            
            <div style={{display: 'flex', gap: '16px'}}>
              <button onClick={() => navigate('/')} style={styles.backHomeBtn}>🏠 Về trang chủ</button>
              <button onClick={() => navigate('/orders-history')} style={styles.viewOrdersBtn}>📦 Xem lịch sử đơn</button>
            </div>
          </div>
        </div>
      )}

      {isInvoiceModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.invoiceModalContainer}>
            <div style={styles.invoicePaperHeader}>
              <div style={{fontSize: '24px', marginBottom: '4px'}}>📝</div>
              <h3 style={styles.invoicePaperTitle}>
                {invoiceType === 'company' ? 'HÓA ĐƠN ĐIỆN TỬ DOANH NGHIỆP' : 'HÓA ĐƠN ĐIỆN TỬ CÁ NHÂN'}
              </h3>
              <p style={{color: '#E67E22', fontWeight: 'bold', margin: '4px 0 0 0', fontSize: '13px'}}>PAPERBOUND SYSTEM</p>
            </div>

            <div style={styles.invoicePaperBody}>
              <div style={styles.invoiceDetailRow}>
                <span style={styles.invoiceDetailLabel}>Mã đơn hàng:</span>
                <span style={styles.invoiceDetailValue}>#DH{createdOrderId}</span>
              </div>
              <div style={styles.invoiceDetailRow}>
                <span style={styles.invoiceDetailLabel}>Đơn vị/Người mua:</span>
                <span style={styles.invoiceDetailValue}>
                  {invoiceType === 'company' ? billingInfo.companyName : (billingInfo.buyerName || shippingInfo.fullName)}
                </span>
              </div>
              <div style={styles.invoiceDetailRow}>
                <span style={styles.invoiceDetailLabel}>{invoiceType === 'company' ? 'Mã số thuế (MST):' : 'Số CCCD/Hộ chiếu:'}</span>
                <span style={styles.invoiceDetailValue}>
                  {invoiceType === 'company' ? (billingInfo.taxId || 'Chưa cung cấp') : (billingInfo.idCard || 'Chưa cung cấp')}
                </span>
              </div>
              {invoiceType === 'company' && billingInfo.companyAddress && (
                <div style={styles.invoiceDetailRow}>
                  <span style={styles.invoiceDetailLabel}>Địa chỉ DN:</span>
                  <span style={styles.invoiceDetailValue}>{billingInfo.companyAddress}</span>
                </div>
              )}
              <div style={styles.invoiceDetailRow}>
                <span style={styles.invoiceDetailLabel}>Email nhận hóa đơn:</span>
                <span style={styles.invoiceDetailValue} style={{color: '#E67E22', fontWeight: '500'}}>{billingInfo.invoiceEmail}</span>
              </div>

              <div style={styles.invoicePaperDivider}></div>

              <div style={{...styles.invoiceDetailRow, marginTop: '5px'}}>
                <span style={{...styles.invoiceDetailLabel, fontWeight: '700', color: '#1E293B'}}>TỔNG TIỀN (Gồm VAT):</span>
                <span style={{fontSize: '18px', fontWeight: '700', color: '#E67E22'}}>
                  {finalTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div style={styles.invoicePaperFooter}>
              <p style={{margin: '0 0 16px 0', fontSize: '13px', color: '#15803D', fontWeight: '500'}}>
                🎉 Hệ thống đồ án: Hóa đơn điện tử hợp lệ đã được khởi tạo và gửi thành công về email của bạn!
              </p>
              <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={styles.invoiceCloseBtn}>
                Đóng cửa sổ kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { 
    padding: '40px 15px 80px 15px', 
    backgroundColor: '#F8FAFC', 
    minHeight: '100vh', 
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box'
  },
  centerBox: { 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '60vh', 
    gap: '20px' 
  },
  spinner: { 
    width: '40px', 
    height: '40px', 
    border: '4px solid #E2E8F0', 
    borderTop: '4px solid #E67E22', 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite' 
  },
  pageTitle: { 
    fontSize: '24px', 
    fontWeight: '700', 
    color: '#2C3E50', 
    marginBottom: '30px', 
    letterSpacing: '0.3px' 
  },
  checkoutGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1.4fr 1fr', 
    gap: '30px', 
    alignItems: 'start' 
  },
  infoSection: { 
    backgroundColor: '#ffffff', 
    padding: '30px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
    border: '1px solid #E2E8F0'
  },
  summarySection: { 
    backgroundColor: '#ffffff', 
    padding: '30px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.01)', 
    border: '1px solid #E2E8F0',
    position: 'sticky', 
    top: '30px' 
  },
  sectionHeader: { 
    margin: '0 0 24px 0', 
    fontSize: '16px', 
    fontWeight: '700', 
    color: '#2C3E50', 
    borderLeft: '4px solid #E67E22', 
    paddingLeft: '12px' 
  },
  switchBar: { 
    display: 'flex', 
    backgroundColor: '#F1F5F9', 
    padding: '4px', 
    borderRadius: '8px', 
    marginBottom: '25px', 
    gap: '4px' 
  },
  switchBtn: { 
    flex: 1, 
    padding: '10px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    backgroundColor: 'transparent', 
    color: '#64748B', 
    fontSize: '13.5px', 
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  switchBtnActive: { 
    flex: 1, 
    padding: '10px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    backgroundColor: '#2C3E50', 
    color: '#ffffff', 
    fontSize: '13.5px', 
    fontWeight: '600', 
    boxShadow: '0 2px 8px rgba(44,62,80,0.15)' 
  },
  invoiceCard: { 
    backgroundColor: '#F8FAFC', 
    padding: '20px', 
    borderRadius: '12px', 
    marginTop: '10px', 
    border: '1px solid #E2E8F0' 
  },
  checkbox: {
    accentColor: '#E67E22', 
    width: '16px', 
    height: '16px', 
    cursor: 'pointer'
  },
  invoiceLabel: {
    fontSize: '14px', 
    fontWeight: '600', 
    color: '#334155', 
    cursor: 'pointer'
  },
  invoiceSubSection: {
    marginTop: '20px', 
    borderTop: '1px dashed #CBD5E1', 
    paddingTop: '20px'
  },
  invoiceTabsBar: {
    display: 'flex', 
    backgroundColor: '#E2E8F0', 
    padding: '4px', 
    borderRadius: '8px', 
    marginBottom: '20px', 
    gap: '4px'
  },
  invoiceTab: { 
    flex: 1, 
    padding: '8px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    backgroundColor: 'transparent', 
    color: '#475569', 
    fontSize: '13px', 
    fontWeight: '600' 
  },
  invoiceTabActive: { 
    flex: 1, 
    padding: '8px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    backgroundColor: '#E67E22', 
    color: '#ffffff', 
    fontSize: '13px', 
    fontWeight: '600' 
  },
  invoiceFormGrid: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    marginTop: '10px' 
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
  },
  inputGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px' 
  },
  label: { 
    fontSize: '13.5px', 
    fontWeight: '600', 
    color: '#475569' 
  },
  input: { 
    height: '44px', 
    padding: '0 16px', 
    borderRadius: '8px', 
    border: '1px solid #CBD5E1', 
    fontSize: '14px', 
    outline: 'none', 
    color: '#1E293B', 
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  inputRequired: {
    height: '44px', 
    padding: '0 16px', 
    borderRadius: '8px', 
    border: '1px solid #CBD5E1', 
    fontSize: '14px', 
    outline: 'none', 
    color: '#1E293B', 
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    borderLeft: '3px solid #E67E22'
  },
  paymentMethodCard: { 
    backgroundColor: '#ffffff', 
    padding: '20px', 
    borderRadius: '12px', 
    marginTop: '10px', 
    border: '1px solid #E2E8F0' 
  },
  paymentMethodTitle: {
    margin: '0 0 16px 0', 
    fontSize: '14.5px', 
    fontWeight: '700', 
    color: '#2C3E50'
  },
  paymentOption: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '14px', 
    padding: '16px', 
    borderRadius: '8px', 
    border: '1px solid #E2E8F0', 
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  radioRow: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
  },
  itemsList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    maxHeight: '260px', 
    overflowY: 'auto', 
    paddingRight: '6px', 
    marginBottom: '24px' 
  },
  itemRow: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '14px', 
    paddingBottom: '14px', 
    borderBottom: '1px solid #F1F5F9' 
  },
  itemImg: { 
    width: '45px', 
    height: '62px', 
    objectFit: 'cover', 
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  },
  itemMeta: { 
    flex: 1 
  },
  itemTitle: { 
    margin: 0, 
    fontSize: '14px', 
    fontWeight: '600', 
    color: '#2C3E50',
    lineHeight: '1.4'
  },
  itemQtyPrice: { 
    fontSize: '12.5px', 
    color: '#64748B', 
    display: 'block', 
    marginTop: '3px' 
  },
  itemSubtotalText: { 
    fontSize: '14px', 
    fontWeight: '600', 
    color: '#2C3E50' 
  },
  billWrapper: { 
    backgroundColor: '#F8FAFC', 
    padding: '20px', 
    borderRadius: '12px', 
    border: '1px solid #E2E8F0'
  },
  billRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    marginBottom: '12px', 
    fontSize: '14px' 
  },
  billLabel: { 
    color: '#64748B', 
    fontWeight: '500' 
  },
  billVal: { 
    color: '#2C3E50', 
    fontWeight: '600' 
  },
  divider: { 
    height: '1px', 
    borderTop: '1px dashed #CBD5E1', 
    margin: '14px 0' 
  },
  totalRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  totalLabel: { 
    fontSize: '14px', 
    fontWeight: '700', 
    color: '#2C3E50' 
  },
  totalVal: { 
    fontSize: '22px', 
    fontWeight: '700', 
    color: '#E67E22' 
  },
  orderBtn: { 
    width: '100%', 
    marginTop: '24px', 
    backgroundColor: '#E67E22', 
    color: '#ffffff', 
    border: 'none', 
    height: '50px', 
    borderRadius: '8px', 
    fontSize: '14.5px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    boxShadow: '0 4px 14px rgba(230,126,34,0.2)',
    transition: 'all 0.2s',
    outline: 'none'
  },
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(15,23,42,0.4)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 5000, 
    backdropFilter: 'blur(4px)' 
  },
  modalContentQr: { 
    backgroundColor: '#ffffff', 
    padding: '30px', 
    borderRadius: '16px', 
    width: '92%', 
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    maxWidth: '440px', 
    textAlign: 'center', 
    position: 'relative'
  },
  modalContentSuccess: {
    backgroundColor: '#ffffff', 
    padding: '40px 32px', 
    borderRadius: '16px', 
    width: '92%', 
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    maxWidth: '480px', 
    textAlign: 'center'
  },
  modalQrTitle: {
    margin: '0 0 8px 0', 
    color: '#2C3E50', 
    fontWeight: '700',
    fontSize: '16px'
  },
  qrWrapper: { 
    backgroundColor: '#F8FAFC', 
    padding: '16px', 
    borderRadius: '12px', 
    display: 'inline-block', 
    margin: '12px 0 20px 0', 
    border: '1px solid #E2E8F0' 
  },
  qrImage: { 
    width: '220px', 
    height: '220px', 
    objectFit: 'contain' 
  },
  qrInfoTable: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: '8px', 
    padding: '16px', 
    textAlign: 'left', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    marginBottom: '24px', 
    fontSize: '14px',
    border: '1px solid #E2E8F0'
  },
  qrInfoRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    borderBottom: '1px dashed #E2E8F0', 
    paddingBottom: '8px' 
  },
  closeModalXBtn: { 
    position: 'absolute', 
    top: '16px', 
    right: '20px', 
    backgroundColor: 'transparent', 
    border: 'none', 
    fontSize: '26px', 
    color: '#94A3B8', 
    cursor: 'pointer' 
  },
  modalSubmitBtn: {
    width: '100%',
    backgroundColor: '#2C3E50',
    color: '#ffffff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  successIcon: { 
    fontSize: '64px', 
    marginBottom: '16px' 
  },
  successTitle: { 
    color: '#E67E22', 
    margin: '0 0 12px 0', 
    fontWeight: '700',
    fontSize: '22px'
  },
  successOrderText: { 
    color: '#2C3E50', 
    fontWeight: '600', 
    fontSize: '15px',
    margin: '0 0 8px 0'
  },
  successSubText: { 
    color: '#64748B', 
    fontSize: '13.5px', 
    lineHeight: '1.5', 
    marginBottom: '28px',
    margin: '0 0 24px 0'
  },
  invoicePrintBox: { 
    marginBottom: '28px', 
    padding: '16px', 
    backgroundColor: '#F0FDF4', 
    borderRadius: '8px', 
    border: '1px solid #DCFCE7' 
  },
  invoicePrintStatus: { 
    fontSize: '13px', 
    color: '#15803D', 
    margin: '0 0 12px 0', 
    fontWeight: '600' 
  },
  printBtn: { 
    padding: '10px 20px', 
    backgroundColor: '#16A34A', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '6px', 
    fontSize: '13px', 
    fontWeight: '600', 
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.2s'
  },
  backHomeBtn: { 
    flex: 1, 
    padding: '13px', 
    backgroundColor: '#F1F5F9', 
    color: '#475569', 
    border: '1px solid #E2E8F0', 
    borderRadius: '8px', 
    fontWeight: '600', 
    fontSize: '14px', 
    cursor: 'pointer',
    outline: 'none'
  },
  viewOrdersBtn: { 
    flex: 1, 
    padding: '13px', 
    backgroundColor: '#2C3E50', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: '600', 
    fontSize: '14px', 
    cursor: 'pointer', 
    boxShadow: '0 4px 12px rgba(44,62,80,0.15)',
    outline: 'none'
  },

  /* CÁC CSS STYLES CHO MODAL HOÁ ĐƠN MỚI */
  invoiceModalContainer: {
    backgroundColor: '#ffffff', 
    padding: '35px 25px', 
    borderRadius: '16px', 
    width: '92%', 
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    maxWidth: '520px', 
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  invoicePaperHeader: {
    borderBottom: '2px solid #E2E8F0',
    paddingBottom: '16px',
    marginBottom: '20px'
  },
  invoicePaperTitle: {
    margin: '5px 0 0 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: '0.5px'
  },
  invoicePaperBody: {
    textAlign: 'left',
    backgroundColor: '#FAFBFD',
    border: '1px dashed #CBD5E1',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px'
  },
  invoiceDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '12px',
    fontSize: '13.5px',
    lineHeight: '1.4'
  },
  invoiceDetailLabel: {
    color: '#64748B',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  invoiceDetailValue: {
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right'
  },
  invoicePaperDivider: {
    height: '1px',
    borderTop: '1px dashed #CBD5E1',
    margin: '16px 0'
  },
  invoicePaperFooter: {
    textAlign: 'center'
  },
  invoiceCloseBtn: {
    width: '100%',
    backgroundColor: '#2C3E50',
    color: '#ffffff',
    border: 'none',
    padding: '12px 0',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 4px 12px rgba(44,62,80,0.1)'
  }
};

export default CheckoutPage;