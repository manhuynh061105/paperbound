import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderService, reviewService } from '../services/api'; 

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Custom Modal Xác nhận hành động (Thay thế hoàn toàn Alert/Confirm mặc định)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', orderId: null });

  // State quản lý Modal Đánh giá sản phẩm (Pop-up xuất hiện khi bấm nút)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // ⭐️ Quản lý trạng thái 5 sao thông minh
  const [rating, setRating] = useState(5);         // Lưu số sao thực tế được Click chọn
  const [hoverRating, setHoverRating] = useState(0);   // Lưu số sao tạm thời khi Di chuột qua
  
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Lấy thông tin người dùng đang đăng nhập
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const userId = savedUser ? savedUser.id : null;
  const username = savedUser ? (savedUser.username || savedUser.name) : 'Thành viên';

  useEffect(() => {
    if (!userId) {
      toast.warning("🔒 Vui lòng đăng nhập để xem lịch sử đơn hàng!");
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getByUserId(userId);
      setOrders(res.data.data || res.data || []);
    } catch (err) {
      console.error("Lỗi lấy lịch sử đơn hàng:", err);
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const canCancelOrder = (createdAtString) => {
    if (!createdAtString) return false;
    const orderTime = new Date(createdAtString).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - orderTime) / (1000 * 60 * 60);
    return hoursDifference <= 2; // Cho phép hủy trong vòng 2 tiếng
  };

  const triggerActionModal = (type, orderId) => {
    setConfirmModal({ isOpen: true, type, orderId });
  };

  const executeAction = async () => {
    const { type, orderId } = confirmModal;
    setConfirmModal({ isOpen: false, type: '', orderId: null });

    const targetStatus = type === 'cancel' ? 'cancelled' : 'completed';
    try {
      const res = await orderService.updateStatus(orderId, { status: targetStatus });
      if (res.data.success) {
        toast.success(type === 'cancel' ? '🛑 Đã hủy đơn hàng thành công!' : '🎉 Xác nhận nhận hàng thành công!');
        fetchOrders();
      }
    } catch (err) {
      toast.error("Thực hiện thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const openReviewModal = (product, orderId) => {
    setSelectedProduct(product);
    setSelectedOrderId(orderId);
    setRating(5);
    setHoverRating(0);
    setComment('');
    setImageFile(null);
    setImagePreview('');
    setIsReviewModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.warning("💬 Vui lòng viết nội dung bình luận!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('product_id', selectedProduct.id);
      formData.append('order_id', selectedOrderId);
      formData.append('rating', rating);
      formData.append('comment', comment.trim());
      
      if (imageFile) {
        formData.append('reviewImage', imageFile);
      }

      console.log("🚀 Payload Form Data gửi lên hệ thống:", {
        user_id: userId,
        product_id: selectedProduct.id,
        order_id: selectedOrderId,
        rating,
        comment
      });

      const res = await reviewService.create(formData);
      
      // ✅ CẢI TIẾN: Nới lỏng điều kiện kiểm tra dữ liệu từ Backend. 
      // Chỉ cần Server phản hồi về mã trạng thái Thành công (200 OK / 201 Created) là đóng Modal ngay lập tức.
      if (res.status === 200 || res.status === 201 || res.data?.success) {
        toast.success(`⭐️ Gửi đánh giá cho "${selectedProduct.title}" thành công!`);
        
        // Đóng modal đánh giá lại ngay lập tức
        setIsReviewModalOpen(false);
        
        // Reset sạch dữ liệu tạm thời trong modal để chuẩn bị cho lần đánh giá sản phẩm tiếp theo
        setSelectedProduct(null);
        setSelectedOrderId(null);
        setComment('');
        setImageFile(null);
        setImagePreview('');
        
        // Tải lại danh sách đơn hàng để cập nhật trạng thái mới nhất
        fetchOrders();
      } else {
        // Trường hợp Backend trả về mã 200 nhưng logic nội bộ có lỗi
        toast.error("Gửi đánh giá thất bại: " + (res.data?.message || "Lỗi không xác định từ server."));
      }
    } catch (err) {
      console.error("Lỗi API review:", err);
      toast.error("Gửi đánh giá thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={styles.loading}>⏳ Đang tải lịch sử đơn hàng của bạn...</div>;

  return (
    <div style={styles.container}>
      {/* Breadcrumb điều hướng */}
      <div style={styles.breadcrumb}>
        Trang chủ  /  <span style={{ color: '#2C3E50', fontWeight: '500' }}>Lịch sử đơn hàng</span>
      </div>

      {/* Tiêu đề lớn */}
      <h1 style={styles.mainTitle}>ĐƠN HÀNG CỦA BẠN</h1>
      <p style={styles.subTitle}>Quản lý và theo dõi quá trình giao nhận đơn hàng</p>

      {/* Bố cục chia 2 cột */}
      <div style={styles.contentLayout}>
        
        {/* CỘT TRÁI: THÔNG TIN TÀI KHOẢN & NAVIGATION MENU */}
        <div style={styles.leftColumn}>
          <div style={styles.profileBox}>
            <div style={styles.avatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <small style={{ color: '#7f8c8d', fontSize: '13px' }}>Xin chào,</small>
              <h4 style={styles.profileName}>{username}</h4>
            </div>
          </div>

          <div style={styles.sideMenu}>
            <button style={{ ...styles.sideMenuBtn, ...styles.sideMenuBtnActive }}>
              Lịch sử mua hàng
            </button>
            <button style={styles.sideMenuBtn} onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT DANH SÁCH ĐƠN HÀNG HOẶC TRẠNG THÁI TRỐNG */}
        <div style={styles.rightColumn}>
          {orders.length === 0 ? (
            <div style={styles.emptyCard}>
              <h3 style={styles.emptyCardTitle}>Chưa có đơn hàng nào</h3>
              <p style={styles.emptyCardSub}>Có vẻ như bạn chưa thưởng thức sản phẩm nào của chúng tôi rồi!</p>
              <button style={styles.orderNowBtn} onClick={() => navigate('/products')}>
                ĐẶT MÓN NGAY
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                {/* Header đơn hàng */}
                <div style={styles.orderHeader}>
                  <div>
                    <span style={styles.orderIdText}>Mã đơn hàng: #{order.id}</span>
                    <span style={styles.orderDate}>
                      📅 {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : 'Chưa rõ'}
                    </span>
                  </div>
                  <span style={styles.statusBadge(order.status)}>
                    {order.status === 'pending' && '⏳ Chờ xử lý'}
                    {order.status === 'completed' && '✅ Đã giao thành công'}
                    {order.status === 'cancelled' && '🛑 Đã hủy'}
                  </span>
                </div>

                {/* Danh sách sản phẩm */}
                <div style={styles.productContainer}>
                  {(!order.products || order.products.length === 0) ? (
                    <div style={{ padding: '10px 0', color: '#7f8c8d', fontSize: '14px' }}>
                      Đang cập nhật danh sách chi tiết đơn hàng..
                    </div>
                  ) : (
                    order.products.map((item) => (
                      <div key={item.id} style={styles.productRow}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <img src={item.cover_image || 'https://via.placeholder.com/60x80'} alt={item.title} style={styles.productImg} />
                          <div>
                            <h5 style={styles.productTitle}>{item.title}</h5>
                            <p style={styles.productQty}>Số lượng: <b style={{color: '#2c3e50'}}>x{item.quantity}</b></p>
                            
                            <button style={styles.viewDetailBtn} onClick={() => navigate(`/products/${item.id}`)}>
                              🔍 Xem chi tiết sản phẩm
                            </button>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={styles.productPrice}>{Number(item.price).toLocaleString()} đ</span>
                          
                          {/* NÚT ĐÁNH GIÁ SẢN PHẨM */}
                            {order.status === 'completed' && !item.is_reviewed && (
                            <button onClick={() => openReviewModal(item, order.id)} style={styles.reviewBtn}>
                                ⭐️ Viết đánh giá
                            </button>
                            )}

                            {/* TRẠNG THÁI ĐÃ ĐÁNH GIÁ */}
                            {order.status === 'completed' && item.is_reviewed && (
                            <span style={{ color: '#7f8c8d', fontSize: '13px', marginTop: '5px', display: 'block', fontStyle: 'italic' }}>
                                ✓ Đã viết nhận xét
                            </span>
                            )}
                          
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer đơn hàng */}
                <div style={styles.orderFooter}>
                  <div style={styles.totalBlock}>
                    Tổng tiền thanh toán: <span style={styles.totalPrice}>{Number(order.total_amount).toLocaleString()} đ</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {order.status === 'pending' && canCancelOrder(order.created_at) && (
                      <button onClick={() => triggerActionModal('cancel', order.id)} style={styles.cancelBtn}>
                        Hủy đơn hàng
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button onClick={() => triggerActionModal('confirm', order.id)} style={styles.confirmBtn}>
                        Đã nhận hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= MODAL XÁC NHẬN HỦY/NHẬN HÀNG ================= */}
      {confirmModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '420px', textAlign: 'center'}}>
            <div style={{fontSize: '45px', marginBottom: '10px'}}>{confirmModal.type === 'cancel' ? '⚠️' : '📦'}</div>
            <h3 style={{margin: '0 0 10px 0', color: '#2C3E50'}}>
              {confirmModal.type === 'cancel' ? 'Xác nhận hủy đơn hàng?' : 'Xác nhận đã nhận hàng?'}
            </h3>
            <p style={{color: '#7f8c8d', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.5'}}>
              {confirmModal.type === 'cancel' 
                ? 'Hành động này không thể hoàn tác. Bạn chắc chắn muốn yêu cầu hủy bỏ đơn hàng này chứ?' 
                : 'Hãy đảm bảo bạn đã nhận đúng, đủ số lượng sản phẩm từ shipper trước khi xác nhận hoàn thành.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmModal({ isOpen: false, type: '', orderId: null })} style={styles.modalCloseBtn}>Đóng lại</button>
              <button 
                onClick={executeAction} 
                style={{
                  ...styles.modalSubmitBtn, 
                  backgroundColor: confirmModal.type === 'cancel' ? '#e74c3c' : '#F14D5C'
                }}
              >
                Đồng ý tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POP-UP MODAL ĐÁNH GIÁ SẢN PHẨM (ĐÃ ĐỔI SANG 5 SAO HOVER/CLICK) ================= */}
      {isReviewModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#F14D5C', fontWeight: 'bold', fontSize: '17px' }}>⭐️ Đánh giá chất lượng sản phẩm</h3>
              <span style={{ cursor: 'pointer', fontSize: '22px', color: '#7f8c8d' }} onClick={() => setIsReviewModalOpen(false)}>✕</span>
            </div>
            <p style={{ margin: '0 0 18px 0', color: '#2c3e50', fontSize: '14px' }}>Đang đánh giá: <b>{selectedProduct?.title}</b></p>
            
            <form onSubmit={handleSubmitReview}>
              
              {/* KHU VỰC CHỌN 5 SAO HIỆU ỨNG TRỰC QUAN */}
              <div style={{ marginBottom: '20px', textAlign: 'center', backgroundColor: '#FDF2F3', padding: '15px', borderRadius: '8px' }}>
                <label style={{...styles.label, marginBottom: '8px', textAlign: 'center'}}>Mức độ hài lòng của bạn:</label>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((index) => {
                    // Ngôi sao sẽ sáng nếu vị trí nhỏ hơn hoặc bằng số sao đang hover hoặc số sao đã được click
                    const activeStar = index <= (hoverRating || rating);
                    return (
                      <span
                        key={index}
                        style={{
                          fontSize: '32px',
                          cursor: 'pointer',
                          color: activeStar ? '#F14D5C' : '#D5DBDB',
                          transition: 'color 0.1s ease',
                          userSelect: 'none'
                        }}
                        onClick={() => setRating(index)}
                        onMouseEnter={() => setHoverRating(index)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {activeStar ? '★' : '☆'}
                      </span>
                    );
                  })}
                </div>
                
                {/* Dòng chữ gợi ý tương ứng số sao */}
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#F14D5C', fontWeight: '600' }}>
                  {(hoverRating || rating)} / 5 Sao - {
                    (hoverRating || rating) === 5 ? 'Tuyệt vời cực kỳ!' :
                    (hoverRating || rating) === 4 ? 'Rất tốt, hài lòng.' :
                    (hoverRating || rating) === 3 ? 'Bình thường.' :
                    (hoverRating || rating) === 2 ? 'Tạm ổn, chưa tốt lắm.' : 'Chất lượng quá kém!'
                  }
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={styles.label}>Viết nhận xét chi tiết:</label>
                <textarea rows="4" placeholder="Hãy viết vài dòng cảm nhận thực tế của bạn về sản phẩm này nhé..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>Đính kèm hình ảnh thực tế (nếu có):</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '13px' }} />
                {imagePreview && <div style={{ marginTop: '10px' }}><img src={imagePreview} alt="Preview" style={styles.previewImg} /></div>}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsReviewModalOpen(false)} style={styles.modalCloseBtn}>Hủy bỏ</button>
                <button type="submit" style={{ ...styles.modalSubmitBtn, backgroundColor: '#F14D5C' }}>Gửi đánh giá</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= STYLESHEET CHUẨN =================
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 15px', fontFamily: '"Segoe UI", Roboto, sans-serif' },
  breadcrumb: { fontSize: '13.5px', color: '#95a5a6', marginBottom: '15px', letterSpacing: '0.3px' },
  mainTitle: { color: '#2C3E50', fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '0.5px' },
  subTitle: { color: '#7f8c8d', fontSize: '14px', margin: '0 0 35px 0' },
  loading: { textAlign: 'center', padding: '100px 0', fontSize: '15px', color: '#7f8c8d', fontWeight: '500' },
  contentLayout: { display: 'flex', gap: '30px', alignItems: 'flex-start' },
  leftColumn: { width: '25%', backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' },
  profileBox: { display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #f3f3f3', paddingBottom: '18px', marginBottom: '18px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F14D5C', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 3px 8px rgba(241,77,92,0.25)' },
  profileName: { margin: '2px 0 0 0', color: '#2C3E50', fontSize: '16px', fontWeight: '700' },
  sideMenu: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sideMenuBtn: { width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', backgroundColor: 'transparent', color: '#666', textAlign: 'left', fontSize: '14.5px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  sideMenuBtnActive: { backgroundColor: '#F14D5C', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(241,77,92,0.2)' },
  rightColumn: { width: '75%', display: 'flex', flexDirection: 'column', gap: '20px' },
  emptyCard: { width: '100%', minHeight: '340px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', boxSizing: 'border-box', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  emptyCardTitle: { fontSize: '24px', fontWeight: 'bold', color: '#F14D5C', margin: '0 0 12px 0' },
  emptyCardSub: { color: '#7f8c8d', fontSize: '14.5px', margin: '0 0 28px 0', textAlign: 'center' },
  orderNowBtn: { backgroundColor: '#F14D5C', color: '#fff', border: 'none', padding: '14px 45px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 5px 15px rgba(241,77,92,0.3)', transition: 'transform 0.2s' },
  orderCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '22px', border: '1px solid #eef2f5', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f6fa', paddingBottom: '14px', marginBottom: '18px' },
  orderIdText: { fontSize: '15.5px', fontWeight: 'bold', color: '#2C3E50', marginRight: '15px' },
  orderDate: { fontSize: '13px', color: '#95a5a6' },
  statusBadge: (status) => ({
    padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
    backgroundColor: status === 'pending' ? '#FFF9E6' : status === 'completed' ? '#EAFAF1' : '#FDF2F2',
    color: status === 'pending' ? '#D35400' : status === 'completed' ? '#27AE60' : '#C0392B',
  }),
  productContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  productRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #f1f2f6', paddingBottom: '15px' },
  productImg: { width: '55px', height: '70px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
  productTitle: { margin: '0 0 5px 0', fontSize: '15px', color: '#2C3E50', fontWeight: '600' },
  productQty: { margin: '0 0 8px 0', fontSize: '13px', color: '#7f8c8d' },
  viewDetailBtn: { backgroundColor: '#f8f9fa', border: '1px solid #dcdde1', color: '#57606f', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  productPrice: { fontWeight: 'bold', color: '#2C3E50', fontSize: '15px', display: 'block' },
  reviewBtn: { backgroundColor: '#fff', border: '1px solid #F14D5C', color: '#F14D5C', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px', transition: 'all 0.2s' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #f5f6fa' },
  totalBlock: { fontSize: '14px', color: '#7f8c8d', fontWeight: '500' },
  totalPrice: { fontSize: '19px', fontWeight: 'bold', color: '#F14D5C', marginLeft: '5px' },
  cancelBtn: { backgroundColor: '#fff', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#F14D5C', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 3px 10px rgba(241,77,92,0.2)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(44, 62, 80, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: '#fff', padding: '28px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' },
  label: { display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#2C3E50' },
  textarea: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdde1', boxSizing: 'border-box', outline: 'none', resize: 'vertical' },
  previewImg: { width: '75px', height: '75px', objectFit: 'cover', borderRadius: '6px', marginTop: '5px' },
  modalCloseBtn: { padding: '8px 18px', border: '1px solid #dcdde1', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', color: '#7f8c8d', fontWeight: '600' },
  modalSubmitBtn: { padding: '8px 20px', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: '600' }
};

export default OrderHistoryPage;