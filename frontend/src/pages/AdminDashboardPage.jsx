import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    summary: { totalRevenue: 0, totalProducts: 0, totalOrders: 0 },
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // 💥 ĐÃ SỬA: Đổi từ dashboardService sang productService theo đúng cấu trúc api.js của bạn
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

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#7f8c8d', fontWeight: '500' }}>Đang tổng hợp số liệu kinh doanh...</p>
      </div>
    );
  }

  // Tìm mức doanh thu lớn nhất trong danh sách để tính tỷ lệ phần trăm chiều cao cột biểu đồ
  const maxRevenue = Math.max(...stats.chartData.map(d => Number(d.monthly_revenue)), 1);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.mainHeader}>
        <div>
          <h2 style={styles.pageTitle}>📊 Báo Cáo Hoạt Động Kinh Doanh</h2>
          <p style={styles.pageSubtitle}>Tổng hợp doanh thu, đơn hàng và hiệu suất kho hàng thời gian thực</p>
        </div>
      </div>

      {/* 3 THẺ CARD TỔNG QUAN (KPI CARDS) */}
      <div style={styles.kpiGrid}>
        <div style={{ ...styles.kpiCard, borderLeft: '5px solid #2ECC71' }}>
          <div style={styles.kpiIconBox}>💰</div>
          <div>
            <div style={styles.kpiLabel}>Tổng Doanh Thu</div>
            <div style={{ ...styles.kpiValue, color: '#2ECC71' }}>
              {stats.summary.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '5px solid #3498DB' }}>
          <div style={styles.kpiIconBox}>📦</div>
          <div>
            <div style={styles.kpiLabel}>Số Lượng Đơn Hàng</div>
            <div style={{ ...styles.kpiValue, color: '#3498DB' }}>
              {stats.summary.totalOrders.toLocaleString('vi-VN')} đơn
            </div>
          </div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '5px solid #E67E22' }}>
          <div style={styles.kpiIconBox}>📚</div>
          <div>
            <div style={styles.kpiLabel}>Tổng Đầu Sách Trong Kho</div>
            <div style={{ ...styles.kpiValue, color: '#E67E22' }}>
              {stats.summary.totalProducts.toLocaleString('vi-VN')} sản phẩm
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC BIỂU ĐỒ DOANH THU */}
      <div style={styles.chartSectionCard}>
        <h3 style={styles.chartTitle}>📈 Biểu Đồ Thống Kê Doanh Thu Các Tháng</h3>
        <p style={styles.chartSubtitle}>Dữ liệu tính trên các đơn hàng đã giao dịch thành công trong năm</p>

        {stats.chartData.length === 0 ? (
          <div style={styles.emptyChart}>
            <span>📉</span>
            <p>Chưa có dữ liệu doanh thu để hiển thị biểu đồ.</p>
          </div>
        ) : (
          <div style={styles.chartContainer}>
            {/* Thân biểu đồ */}
            <div style={styles.chartBarsArea}>
              {stats.chartData.map((item, index) => {
                // Tính chiều cao cột dựa trên tỷ lệ doanh thu tháng đó so với tháng cao nhất
                const heightPercentage = (Number(item.monthly_revenue) / maxRevenue) * 100;
                
                return (
                  <div key={index} style={styles.chartColumnWrapper}>
                    {/* Số tiền hiển thị trên đầu cột */}
                    <span style={styles.barTooltip}>
                      {Number(item.monthly_revenue) >= 1000000 
                        ? `${(Number(item.monthly_revenue) / 1000000).toFixed(1)}M`
                        : Number(item.monthly_revenue).toLocaleString('vi-VN')
                      }
                    </span>
                    
                    {/* Cột màu động */}
                    <div 
                      style={{ 
                        ...styles.chartBar, 
                        height: `${Math.max(heightPercentage, 8)}%` // Tối thiểu 8% nhìn cho đẹp
                      }}
                    >
                      <span style={styles.orderCountBadge}>{item.order_count} đơn</span>
                    </div>

                    {/* Nhãn tháng ở chân cột */}
                    <span style={styles.chartXLabel}>{item.month_year}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ================= CSS STYLESHEET CHO GIAO DIỆN DASHBOARD HOÀN HẢO =================
const styles = {
  container: { padding: '40px 6%', backgroundColor: '#F4F6F8', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  mainHeader: { marginBottom: '35px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#1A2530', letterSpacing: '-0.5px' },
  pageSubtitle: { margin: '4px 0 0 0', fontSize: '13.5px', color: '#7F8C8D' },
  
  // KPI Cards Styles
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '40px' },
  kpiCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' },
  kpiIconBox: { width: '55px', height: '55px', backgroundColor: '#F8F9FA', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' },
  kpiLabel: { fontSize: '13.5px', fontWeight: '700', color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  kpiValue: { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' },
  
  // Chart Section Styles
  chartSectionCard: { backgroundColor: '#ffffff', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' },
  chartTitle: { margin: 0, fontSize: '17px', fontWeight: '800', color: '#1A2530' },
  chartSubtitle: { margin: '4px 0 30px 0', fontSize: '13px', color: '#95A5A6' },
  emptyChart: { padding: '60px 0', textAlign: 'center', color: '#95A5A6' },
  
  // Custom HTML CSS Bar Chart
  chartContainer: { height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '2px solid #E5E8E8', paddingBottom: '10px' },
  chartBarsArea: { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', width: '100%', padding: '0 20px' },
  chartColumnWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%', justifyContent: 'flex-end', gap: '10px', position: 'relative' },
  barTooltip: { fontSize: '11px', fontWeight: '700', color: '#2C3E50', backgroundColor: '#EAEDED', padding: '3px 6px', borderRadius: '4px', marginBottom: '2px' },
  chartBar: { width: '100%', background: 'linear-gradient(180deg, #F14D5C 0%, #F57C87 100%)', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '8px', transition: 'all 0.5s ease', cursor: 'pointer', boxShadow: '0 4px 12px rgba(241,77,92,0.15)' },
  chartBar: {
    width: '100%',
    background: 'linear-gradient(180deg, #3498DB 0%, #85C1E9 100%)', // Đổi sang tông xanh dương sang trọng
    borderRadius: '6px 6px 0 0',
    display: 'flex',
    justify: 'center',
    alignItems: 'flex-start',
    paddingTop: '8px',
    transition: 'all 0.5s ease-in-out',
    boxShadow: '0 4px 12px rgba(52,152,219,0.15)'
  },
  orderCountBadge: { fontSize: '9px', fontWeight: '700', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '10px', whiteSpace: 'nowrap' },
  chartXLabel: { fontSize: '12px', fontWeight: '600', color: '#7F8C8D', marginTop: '5px', whiteSpace: 'nowrap' },
  
  // Loader Styles
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '15px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498DB', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

export default AdminDashboardPage;