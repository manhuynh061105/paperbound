import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { toast } from 'react-toastify';
// 1. Import trực tiếp component AddProductModal vào đây
import AddProductModal from './AddProductModal'; 

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    summary: { totalRevenue: 0, totalProducts: 0, totalOrders: 0 },
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  
  // 2. Tạo State quản lý việc hiển thị Modal Thêm sản phẩm
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await productService.getDashboardStats(); 
        if (response?.data?.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("❌ Lỗi tải thống kê:", error);
        toast.error("Không thể tải dữ liệu thống kê hệ thống!");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 3. Hàm xử lý khi bấm nút "Xác nhận thêm" từ Modal gửi dữ liệu lên Server
  const handleAddProductSubmit = async (newProductData) => {
    try {
      // Gọi API thêm sản phẩm từ productService của bạn
      const response = await productService.create(newProductData);
      if (response?.data?.success || response?.status === 200 || response?.status === 201) {
        toast.success("🎉 Thêm đầu sách mới thành công!");
        
        // Load lại số liệu thống kê để cập nhật "Tổng Đầu Sách Trong Kho" tăng lên
        const refreshRes = await productService.getDashboardStats();
        if (refreshRes?.data?.success) {
          setStats(refreshRes.data.data);
        }
      }
    } catch (error) {
      console.error("❌ Lỗi khi thêm sản phẩm:", error);
      toast.error(error.response?.data?.message || "Không thể thêm sách mới, vui lòng thử lại!");
    }
  };

  const handlePrintReport = () => {
    toast.success("⏳ Đang chuẩn bị bản in báo cáo kinh doanh...");
    setTimeout(() => {
      window.print();
    }, 800);
  };

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748B', fontWeight: '500' }}>Đang tổng hợp số liệu kinh doanh...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.chartData.map(d => Number(d.monthly_revenue)), 1);

  return (
    <div style={styles.container} className="printable-dashboard">
      <div style={styles.mainHeader}>
        <div>
          <h2 style={styles.pageTitle}>📊 Báo Cáo Hoạt Động Kinh Doanh</h2>
          <p style={styles.pageSubtitle}>Tổng hợp doanh thu, đơn hàng và hiệu suất kho hàng thời gian thực</p>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <div style={{ ...styles.kpiCard, borderLeft: '5px solid #E67E22' }}>
          <div style={{ ...styles.kpiIconBox, color: '#E67E22', backgroundColor: '#FDF6F0' }}>💰</div>
          <div>
            <div style={styles.kpiLabel}>Tổng Doanh Thu</div>
            <div style={{ ...styles.kpiValue, color: '#2C3E50' }}>
              {stats.summary.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '5px solid #2C3E50' }}>
          <div style={{ ...styles.kpiIconBox, color: '#2C3E50', backgroundColor: '#F1F5F9' }}>📦</div>
          <div>
            <div style={styles.kpiLabel}>Số Lượng Đơn Hàng</div>
            <div style={{ ...styles.kpiValue, color: '#2C3E50' }}>
              {stats.summary.totalOrders.toLocaleString('vi-VN')} đơn
            </div>
          </div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '5px solid #64748B' }}>
          <div style={{ ...styles.kpiIconBox, color: '#64748B', backgroundColor: '#F8FAFC' }}>📚</div>
          <div>
            <div style={styles.kpiLabel}>Tổng Đầu Sách Trong Kho</div>
            <div style={{ ...styles.kpiValue, color: '#2C3E50' }}>
              {stats.summary.totalProducts.toLocaleString('vi-VN')} sản phẩm
            </div>
          </div>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.chartSectionCard}>
          <h3 style={styles.chartTitle}>📈 Biểu Đồ Thống Kê Doanh Thu Các Tháng</h3>
          <p style={styles.chartSubtitle}>Dữ liệu tính trên các đơn hàng đã giao dịch thành công trong năm</p>

          {stats.chartData.length === 0 ? (
            <div style={styles.emptyChart}>
              <span style={{ fontSize: '40px' }}>📉</span>
              <p style={{ marginTop: '10px' }}>Chưa có dữ liệu doanh thu để hiển thị biểu đồ.</p>
            </div>
          ) : (
            <div style={styles.chartContainer}>
              <div style={styles.chartBarsArea}>
                {stats.chartData.map((item, index) => {
                  const heightPercentage = (Number(item.monthly_revenue) / maxRevenue) * 100;
                  return (
                    <div key={index} style={styles.chartColumnWrapper}>
                      <span style={styles.barTooltip}>
                        {Number(item.monthly_revenue) >= 1000000 
                          ? `${(Number(item.monthly_revenue) / 1000000).toFixed(1)}M`
                          : Number(item.monthly_revenue).toLocaleString('vi-VN')
                        }
                      </span>
                      
                      <div 
                        style={{ 
                          ...styles.chartBar, 
                          height: `${Math.max(heightPercentage, 12)}%` 
                        }}
                      >
                        <span style={styles.orderCountBadge}>{item.order_count} đơn</span>
                      </div>

                      <span style={styles.chartXLabel}>{item.month_year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={styles.sideSection} className="no-print">
          <div style={styles.contentCard}>
            <h4 style={styles.cardTitle}>⚡ Thao tác nhanh hệ thống</h4>
            <div style={styles.quickActionsList}>
              {/* 4. Đổi sự kiện onClick để đổi trạng thái state mở Modal lên */}
              <button 
                type="button" 
                style={styles.actionBtn} 
                onClick={() => setIsAddModalOpen(true)}
              >
                ➕ Thêm đầu sách mới
              </button>
              
              <button 
                type="button" 
                style={styles.actionBtnOutline} 
                onClick={handlePrintReport}
              >
                🖨️ In báo cáo thống kê
              </button>
            </div>
          </div>

          <div style={styles.contentCard}>
            <h4 style={styles.cardTitle}>🎯 Chỉ tiêu kinh doanh tháng này</h4>
            <div style={styles.progressContainer}>
              <div style={styles.progressMeta}>
                <span style={styles.progressLabel}>Mục tiêu doanh thu</span>
                <span style={styles.progressValue}>75%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: '75%', backgroundColor: '#E67E22' }}></div>
              </div>
            </div>
            <div style={{ ...styles.progressContainer, marginTop: '16px' }}>
              <div style={styles.progressMeta}>
                <span style={styles.progressLabel}>Chỉ tiêu xử lý đơn</span>
                <span style={styles.progressValue}>92%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: '92%', backgroundColor: '#2C3E50' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Khai báo Modal nằm ở đây để nhận lệnh đóng mở từ trang Dashboard */}
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddProductSubmit} 
      />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .printable-dashboard { padding: 10px !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

// ... Toàn bộ hệ thống styles phía dưới giữ nguyên như cũ của bạn ...
const styles = {
  container: { padding: '40px 15px 80px 15px', backgroundColor: '#F8FAFC', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: 'border-box' },
  mainHeader: { marginBottom: '32px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#2C3E50', letterSpacing: '0.3px' },
  pageSubtitle: { margin: '6px 0 0 0', fontSize: '14px', color: '#64748B' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' },
  kpiCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' },
  kpiIconBox: { width: '54px', height: '54px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' },
  kpiLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  kpiValue: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' },
  chartSectionCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', border: '1px solid #E2E8F0' },
  chartTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#2C3E50' },
  chartSubtitle: { margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748B' },
  emptyChart: { padding: '80px 0', textAlign: 'center', color: '#94A3B8' },
  chartContainer: { height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '2px solid #E2E8F0', paddingBottom: '6px' },
  chartBarsArea: { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', width: '100%' },
  chartColumnWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px', height: '100%', justifyContent: 'flex-end', gap: '8px', position: 'relative' },
  barTooltip: { fontSize: '11px', fontWeight: '700', color: '#475569', backgroundColor: '#F1F5F9', padding: '4px 6px', borderRadius: '4px', whiteSpace: 'nowrap' },
  chartBar: { width: '100%', background: 'linear-gradient(180deg, #E67E22 0%, #F39C12 100%)', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '6px', transition: 'all 0.4s ease-in-out', boxShadow: '0 4px 10px rgba(230,126,34,0.15)' },
  orderCountBadge: { fontSize: '9px', fontWeight: '700', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.15)', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap' },
  chartXLabel: { fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '6px', whiteSpace: 'nowrap' },
  sideSection: { display: 'flex', flexDirection: 'column', gap: '24px' },
  contentCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', border: '1px solid #E2E8F0' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '14.5px', fontWeight: '700', color: '#2C3E50' },
  quickActionsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  actionBtn: { width: '100%', backgroundColor: '#E67E22', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer', transition: 'opacity 0.2s', outline: 'none' },
  actionBtnOutline: { width: '100%', backgroundColor: 'transparent', color: '#475569', border: '1px solid #CBD5E1', padding: '11px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer', transition: 'background-color 0.2s', outline: 'none' },
  progressContainer: { display: 'flex', padding: 0, flexDirection: 'column', gap: '6px' },
  progressMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' },
  progressLabel: { color: '#64748B' },
  progressValue: { color: '#2C3E50' },
  progressBarBg: { width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '10px' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '16px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid #E67E22', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

export default AdminDashboardPage;