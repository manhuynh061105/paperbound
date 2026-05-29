import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footerContainer}>
      {/* TÍCH HỢP HIỆU ỨNG HOVER ĐỔI MÀU CHO CÁC ĐƯỜNG LINK */}
      <style>{footerHoverCSS}</style>

      {/* PHẦN CHÍNH CỦA FOOTER - CHIA LƯỚI 4 CỘT CHUẨN FAHASA */}
      <div style={styles.footerMain}>
        
        {/* CỘT 1: THÔNG TIN THƯƠNG HIỆU */}
        <div style={styles.footerColumn}>
          <h2 style={styles.logoText}>
            PAPERBOUND<span style={{ color: '#F14D5C' }}>.</span>
          </h2>
          <p style={styles.brandDescription}>
            Hệ thống nhà sách thông minh số hóa trực tuyến. Phục vụ hàng ngàn tựa sách bản quyền phong phú, tích hợp hóa đơn điện tử VAT 5% đầy đủ và minh bạch.
          </p>
          <p style={styles.addressText}>📍 68 Đường Lập Trình, Quận Hải Châu, Đà Nẵng</p>
          <p style={styles.addressText}>✉️ support@paperbound.vn</p>
        </div>

        {/* CỘT 2: DỊCH VỤ CỦA CHÚNG TÔI */}
        <div style={styles.footerColumn}>
          <h4 style={styles.columnTitle}>DỊCH VỤ & CHÍNH SÁCH</h4>
          <ul style={styles.linkList}>
            <li className="footer-link-item">Chính sách điều khoản sử dụng</li>
            <li className="footer-link-item">Chính sách bảo mật thông tin</li>
            <li className="footer-link-item">Chính sách vận chuyển siêu tốc</li>
            <li className="footer-link-item">Chính sách bảo hành & đổi trả</li>
          </ul>
        </div>

        {/* CỘT 3: HỖ TRỢ KHÁCH HÀNG */}
        <div style={styles.footerColumn}>
          <h4 style={styles.columnTitle}>HỖ TRỢ KHÁCH HÀNG</h4>
          <ul style={styles.linkList}>
            <li className="footer-link-item">Phương thức thanh toán tích hợp</li>
            <li className="footer-link-item">Chính sách giảm thuế VAT 5%</li>
            <li className="footer-link-item">Câu hỏi thường gặp (FAQs)</li>
            <li className="footer-link-item">Hệ thống tài khoản thành viên</li>
          </ul>
        </div>

        {/* CỘT 4: KẾT NỐI & KHUYẾN MÃI */}
        <div style={styles.footerColumn}>
          <h4 style={styles.columnTitle}>KẾT NỐI VỚI CHÚNG TÔI</h4>
          <p style={styles.brandDescription}>Đăng ký nhận tin để không bỏ lỡ các đợt phát hành sách hot nhất.</p>
          
          <div style={styles.subscribeBox}>
            <input type="text" placeholder="Nhập email của bạn..." style={styles.subscribeInput} />
            <button style={styles.subscribeBtn}>Gửi</button>
          </div>

          <div style={styles.socialRow}>
            <span style={styles.socialIcon} className="footer-social-icon">🔵 Facebook</span>
            <span style={styles.socialIcon} className="footer-social-icon">🔴 Instagram</span>
          </div>
        </div>

      </div>

      {/* ĐƯỜNG KẺ NGĂN CÁCH MẢNH */}
      <hr style={styles.footerDivider} />

      {/* PHẦN COPYRIGHT DƯỚI CÙNG */}
      <div style={styles.footerBottom}>
        <p style={styles.copyrightText}>
          © 2026 Paperbound Bookstore. Bảo lưu mọi quyền. Hệ thống quản lý và vận hành trực tuyến chuyên nghiệp.
        </p>
      </div>
    </footer>
  );
};

// CSS HOVER CHO CÁC ĐƯỜNG LINK TRỞ NÊN MƯỢT MÀ VÀ ĐỒNG BỘ MÀU ĐỎ FAHASA
const footerHoverCSS = `
  .footer-link-item {
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 4px 0;
  }
  .footer-link-item:hover {
    color: #F14D5C !important;
    transform: translateX(4px);
  }
  .footer-social-icon {
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .footer-social-icon:hover {
    transform: scale(1.1);
    color: #F14D5C !important;
  }
`;

const styles = {
  // GỠ BỎ POSITION FIXED - CHO FOOTER NẰM TỰ NHIÊN DƯỚI ĐÁY TRANG VỚI NỀN TRẮNG SẠCH SẼ
  footerContainer: {
    backgroundColor: '#ffffff',
    color: '#4f5d75',
    padding: '45px 0 25px 0',
    borderTop: '1px solid #f1f2f6',
    boxShadow: '0 -4px 15px rgba(0,0,0,0.02)',
    fontFamily: 'Arial, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '50px' // Đẩy xa nội dung bên trên tạo không gian thở
  },
  
  // Layout 4 cột căn giữa đồng bộ với độ rộng 1200px của trang chủ
  footerMain: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    boxSizing: 'border-box'
  },
  
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  logoText: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#2C3E50', letterSpacing: '1px' },
  columnTitle: { margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#2C3E50', borderBottom: '2px solid #F14D5C', paddingBottom: '6px', alignSelf: 'flex-start' },
  
  brandDescription: { fontSize: '13px', color: '#7f8c8d', lineHeight: '1.6', margin: 0 },
  addressText: { fontSize: '13px', color: '#4f5d75', margin: 0 },
  
  linkList: { listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#4f5d75' },
  
  // Hộp thư đăng ký nhận tin khuyến mãi
  subscribeBox: { display: 'flex', border: '1px solid #F14D5C', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#fff', maxWidth: '240px' },
  subscribeInput: { flex: 1, border: 'none', outline: 'none', padding: '8px 14px', fontSize: '12.5px' },
  subscribeBtn: { backgroundColor: '#F14D5C', color: '#fff', border: 'none', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  
  socialRow: { display: 'flex', gap: '15px', fontSize: '13px', marginTop: '5px' },
  socialIcon: { color: '#7f8c8d', fontWeight: '500' },
  
  footerDivider: { border: 'none', borderTop: '1px solid #f1f2f6', margin: '30px 0 20px 0' },
  
  footerBottom: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' },
  copyrightText: { margin: 0, fontSize: '12.5px', color: '#95a5a6' }
};

export default Footer;