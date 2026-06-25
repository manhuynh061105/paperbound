import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footerContainer}>
      <style>{footerHoverCSS}</style>

      <div style={styles.footerMain}>
        
        <div style={styles.footerColumn}>
          <h2 style={styles.logoText}>
            PAPERBOUND<span style={{ color: '#E67E22' }}>.</span>
          </h2>
          <p style={styles.brandDescription}>
            Hệ thống nhà sách thông minh số hóa trực tuyến. Phục vụ hàng ngàn tựa sách bản quyền phong phú, tích hợp hóa đơn điện tử VAT 5% đầy đủ và minh bạch.
          </p>
          <p style={styles.addressText}>📍 68 Đường Lập Trình, Quận Hải Châu, Đà Nẵng</p>
          <p style={styles.addressText}>✉️ support@paperbound.vn</p>
        </div>

        <div style={styles.footerColumn}>
          <h4 style={styles.columnTitle}>DỊCH VỤ & CHÍNH SÁCH</h4>
          <ul style={styles.linkList}>
            <li className="footer-link-item">Chính sách điều khoản sử dụng</li>
            <li className="footer-link-item">Chính sách bảo mật thông tin</li>
            <li className="footer-link-item">Chính sách vận chuyển siêu tốc</li>
            <li className="footer-link-item">Chính sách bảo hành & đổi trả</li>
          </ul>
        </div>

        <div style={styles.footerColumn}>
          <h4 style={styles.columnTitle}>HỖ TRỢ KHÁCH HÀNG</h4>
          <ul style={styles.linkList}>
            <li className="footer-link-item">Phương thức thanh toán tích hợp</li>
            <li className="footer-link-item">Chính sách giảm thuế VAT 5%</li>
            <li className="footer-link-item">Câu hỏi thường gặp (FAQs)</li>
            <li className="footer-link-item">Hệ thống tài khoản thành viên</li>
          </ul>
        </div>

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

      <hr style={styles.footerDivider} />

      <div style={styles.footerBottom}>
        <p style={styles.copyrightText}>
          © 2026 Paperbound Bookstore. Bảo lưu mọi quyền. Hệ thống quản lý và vận hành trực tuyến chuyên nghiệp.
        </p>
      </div>
    </footer>
  );
};

const footerHoverCSS = `
  .footer-link-item {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    padding: 2px 0;
  }
  .footer-link-item:hover {
    color: #E67E22 !important;
    transform: translateX(6px);
  }
  .footer-social-icon {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }
  .footer-social-icon:hover {
    transform: translateY(-2px);
    color: #E67E22 !important;
  }
`;

const styles = {
  footerContainer: {
    backgroundColor: '#ffffff',
    color: '#475569',
    padding: '60px 0 30px 0',
    borderTop: '1px solid #E2E8F0',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.01)',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '60px'
  },
  footerMain: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    boxSizing: 'border-box'
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  logoText: { 
    margin: 0, 
    fontSize: '22px', 
    fontWeight: '800', 
    color: '#2C3E50', 
    letterSpacing: '0.8px' 
  },
  columnTitle: { 
    margin: 0, 
    fontSize: '14px', 
    fontWeight: '700', 
    color: '#2C3E50', 
    borderBottom: '2px solid #E67E22', 
    paddingBottom: '6px', 
    alignSelf: 'flex-start',
    letterSpacing: '0.3px'
  },
  brandDescription: { 
    fontSize: '13.5px', 
    color: '#64748B', 
    lineHeight: '1.6', 
    margin: 0 
  },
  addressText: { 
    fontSize: '13.5px', 
    color: '#475569', 
    margin: 0 
  },
  linkList: { 
    listStyleType: 'none', 
    padding: 0, 
    margin: 0, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    fontSize: '13.5px', 
    color: '#475569' 
  },
  subscribeBox: { 
    display: 'flex', 
    border: '1px solid #E2E8F0', 
    borderRadius: '24px', 
    overflow: 'hidden', 
    backgroundColor: '#F8FAFC', 
    maxWidth: '280px',
    transition: 'border-color 0.2s'
  },
  subscribeInput: { 
    flex: 1, 
    border: 'none', 
    outline: 'none', 
    padding: '10px 16px', 
    fontSize: '13px',
    backgroundColor: 'transparent',
    color: '#1E293B'
  },
  subscribeBtn: { 
    backgroundColor: '#2C3E50', 
    color: '#ffffff', 
    border: 'none', 
    padding: '0 20px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    fontSize: '13px',
    transition: 'background-color 0.2s'
  },
  socialRow: { 
    display: 'flex', 
    gap: '20px', 
    fontSize: '13.5px', 
    marginTop: '4px' 
  },
  socialIcon: { 
    color: '#64748B', 
    fontWeight: '500' 
  },
  footerDivider: { 
    border: 'none', 
    borderTop: '1px solid #E2E8F0', 
    margin: '40px 0 24px 0' 
  },
  footerBottom: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '0 24px', 
    textAlign: 'center' 
  },
  copyrightText: { 
    margin: 0, 
    fontSize: '13px', 
    color: '#94A3B8' 
  }
};

export default Footer;