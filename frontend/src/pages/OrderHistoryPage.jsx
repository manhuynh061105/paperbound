import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderService, reviewService } from '../services/api'; 

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', orderId: null });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  const [rating, setRating] = useState(5);         
  const [hoverRating, setHoverRating] = useState(0);   
  
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
      console.error(err);
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
    return hoursDifference <= 2; 
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
        formData.append('review_image', imageFile); 
      }

      const res = await reviewService.create(formData);
      
      if (res.status === 200 || res.status === 201 || res.data?.success) {
        toast.success(`⭐️ Gửi đánh giá cho "${selectedProduct.title}" thành công!`);
        setIsReviewModalOpen(false);
        setSelectedProduct(null);
        setSelectedOrderId(null);
        setComment('');
        setImageFile(null);
        setImagePreview('');
        fetchOrders();
      } else {
        toast.error("Gửi đánh giá thất bại: " + (res.data?.message || "Lỗi không xác định từ server."));
      }
    } catch (err) {
      console.error(err);
      toast.error("Gửi đánh giá thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={styles.loading}>⏳ Đang tải lịch sử đơn hàng của bạn...</div>;

  return (
    <div style={styles.container}>
      <style>{hoverEffectsCSS}</style>
      
      <div style={styles.breadcrumb}>
        Trang chủ  /  <span style={{ color: '#2C3E50', fontWeight: '500' }}>Lịch sử đơn hàng</span>
      </div>

      <h1 style={styles.mainTitle}>ĐƠN HÀNG CỦA BẠN</h1>
      <p style={styles.subTitle}>Quản lý và theo dõi quá trình giao nhận đơn hàng</p>

      <div style={styles.contentLayout}>
        
        <div style={styles.leftColumn}>
          <div style={styles.profileBox}>
            <div style={styles.avatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <small style={{ color: '#64748B', fontSize: '13px' }}>Xin chào,</small>
              <h4 style={styles.profileName}>{username}</h4>
            </div>
          </div>

          <div style={styles.sideMenu}>
            <button style={{ ...styles.sideMenuBtn, ...styles.sideMenuBtnActive }}>
              Lịch sử mua hàng
            </button>
            <button className="side-menu-hover" style={styles.sideMenuBtn} onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>

        <div style={styles.rightColumn}>
          {orders.length === 0 ? (
            <div style={styles.emptyCard}>
              <h3 style={styles.emptyCardTitle}>Chưa có đơn hàng nào</h3>
              <p style={styles.emptyCardSub}>Có vẻ như bạn chưa thưởng thức sản phẩm nào của chúng tôi rồi!</p>
              <button className="primary-btn-hover" style={styles.orderNowBtn} onClick={() => navigate('/products')}>
                Đặt sách ngay
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={styles.orderIdText}>Mã đơn hàng: #{order.id}</span>
                    {order.created_at && (
                      <span style={styles.orderDate}>
                        Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <span style={styles.statusBadge(order.status?.toLowerCase())}>
                    {order.status === 'pending' ? '⏳ Chờ xử lý' : 
                     order.status === 'processing' ? '⚙️ Đang xử lý' :
                     order.status === 'completed' ? '✅ Thành công' :
                     order.status === 'cancelled' ? '❌ Đã hủy' : '🚚 Đang giao hàng'}
                  </span>
                </div>

                <div style={styles.productContainer}>
                  {(!order.products || order.products.length === 0) ? (
                    <div style={{ padding: '10px 0', color: '#64748B', fontSize: '14px' }}>
                      Đang cập nhật danh sách chi tiết đơn hàng..
                    </div>
                  ) : (
                    order.products.map((item) => (
                      <div key={item.id} style={styles.productRow}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <img src={item.cover_image || 'https://via.placeholder.com/60x80'} alt={item.title} style={styles.productImg} />
                          <div>
                            <h5 style={styles.productTitle}>{item.title}</h5>
                            <p style={styles.productQty}>Số lượng: <b style={{color: '#2C3E50'}}>x{item.quantity}</b></p>
                            
                            <button className="secondary-btn-hover" style={styles.viewDetailBtn} onClick={() => navigate(`/products/${item.id}`)}>
                              🔍 Xem chi tiết sản phẩm
                            </button>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={styles.productPrice}>{Number(item.price).toLocaleString()} đ</span>
                          
                          {order.status === 'completed' && !item.is_reviewed && (
                            <button className="review-btn-hover" onClick={() => openReviewModal(item, order.id)} style={styles.reviewBtn}>
                              ⭐️ Viết đánh giá
                            </button>
                          )}

                          {order.status === 'completed' && item.is_reviewed && (
                            <span style={{ color: '#94A3B8', fontSize: '13px', marginTop: '5px', display: 'block', fontStyle: 'italic' }}>
                              ✓ Đã viết nhận xét
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.orderFooter}>
                  <div style={styles.totalBlock}>
                    Tổng tiền thanh toán: <span style={styles.totalPrice}>{Number(order.total_amount).toLocaleString()} đ</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(order.status?.toLowerCase() === 'pending') && (
                      <button className="cancel-btn-hover" onClick={() => triggerActionModal('cancel', order.id)} style={styles.cancelBtn}>
                        Hủy đơn hàng
                      </button>
                    )}
                    
                    {(order.status?.toLowerCase() !== 'completed' && order.status?.toLowerCase() !== 'cancelled') && (
                      <button className="confirm-btn-hover" onClick={() => triggerActionModal('confirm', order.id)} style={styles.confirmBtn}>
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

      {confirmModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '440px', textAlign: 'center'}}>
            <div style={{fontSize: '48px', marginBottom: '12px'}}>{confirmModal.type === 'cancel' ? '⚠️' : '📦'}</div>
            <h3 style={{margin: '0 0 12px 0', color: '#2C3E50', fontSize: '18px', fontWeight: '700'}}>
              {confirmModal.type === 'cancel' ? 'Xác nhận hủy đơn hàng?' : 'Xác nhận đã nhận hàng?'}
            </h3>
            <p style={{color: '#64748B', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.6'}}>
              {confirmModal.type === 'cancel' 
                ? 'Hành động này không thể hoàn tác. Bạn chắc chắn muốn yêu cầu hủy bỏ đơn hàng này chứ?' 
                : 'Hãy đảm bảo bạn đã nhận đúng, đủ số lượng sản phẩm từ shipper trước khi xác nhận hoàn thành.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="secondary-btn-hover" onClick={() => setConfirmModal({ isOpen: false, type: '', orderId: null })} style={styles.modalCloseBtn}>Đóng lại</button>
              <button 
                className="action-btn-hover"
                onClick={executeAction} 
                style={{
                  ...styles.modalSubmitBtn, 
                  backgroundColor: confirmModal.type === 'cancel' ? '#EF4444' : '#E67E22'
                }}
              >
                Đồng ý tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {isReviewModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontWeight: '700', fontSize: '18px' }}>⭐️ Đánh giá chất lượng sản phẩm</h3>
              <span style={{ cursor: 'pointer', fontSize: '20px', color: '#94A3B8' }} onClick={() => setIsReviewModalOpen(false)}>✕</span>
            </div>
            <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '14px' }}>Đang đánh giá: <b style={{color: '#2C3E50'}}>{selectedProduct?.title}</b></p>
            
            <form onSubmit={handleSubmitReview}>
              
              <div style={{ marginBottom: '24px', textAlign: 'center', backgroundColor: '#FFF7ED', padding: '16px', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
                <label style={{...styles.label, marginBottom: '8px', textAlign: 'center'}}>Mức độ hài lòng của bạn:</label>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((index) => {
                    const activeStar = index <= (hoverRating || rating);
                    return (
                      <span
                        key={index}
                        style={{
                          fontSize: '36px',
                          cursor: 'pointer',
                          color: activeStar ? '#E67E22' : '#CBD5E1',
                          transition: 'transform 0.1s ease, color 0.1s ease',
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
                
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#E67E22', fontWeight: '600' }}>
                  {(hoverRating || rating)} / 5 Sao - {
                    (hoverRating || rating) === 5 ? 'Tuyệt vời cực kỳ!' :
                    (hoverRating || rating) === 4 ? 'Rất tốt, hài lòng.' :
                    (hoverRating || rating) === 3 ? 'Bình thường.' :
                    (hoverRating || rating) === 2 ? 'Tạm ổn, chưa tốt lắm.' : 'Chất lượng quá kém!'
                  }
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>Viết nhận xét chi tiết:</label>
                <textarea rows="4" placeholder="Hãy viết vài dòng cảm nhận thực tế của bạn về sản phẩm này nhé..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={styles.label}>Đính kèm hình ảnh thực tế (nếu có):</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '13.5px', color: '#475569' }} />
                {imagePreview && <div style={{ marginTop: '12px' }}><img src={imagePreview} alt="Preview" style={styles.previewImg} /></div>}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="secondary-btn-hover" type="button" onClick={() => setIsReviewModalOpen(false)} style={styles.modalCloseBtn}>Hủy bỏ</button>
                <button className="confirm-btn-hover" type="submit" style={{ ...styles.modalSubmitBtn, backgroundColor: '#E67E22' }}>Gửi đánh giá</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const hoverEffectsCSS = `
  .side-menu-hover:hover { background-color: #F1F5F9 !important; color: #2C3E50 !important; }
  .primary-btn-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(230,126,34,0.35) !important; background-color: #D35400 !important; }
  .secondary-btn-hover:hover { background-color: #E2E8F0 !important; border-color: #CBD5E1 !important; color: #1E293B !important; }
  .review-btn-hover:hover { background-color: #E67E22 !important; color: #fff !important; }
  .cancel-btn-hover:hover { background-color: #FEF2F2 !important; border-color: #EF4444 !important; }
  .confirm-btn-hover:hover { background-color: #1A252F !important; box-shadow: 0 4px 12px rgba(44,62,80,0.25) !important; }
  .action-btn-hover:hover { filter: brightness(0.9); }
`;

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '50px 24px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  breadcrumb: { fontSize: '13.5px', color: '#94A3B8', marginBottom: '16px', letterSpacing: '0.3px' },
  mainTitle: { color: '#2C3E50', fontSize: '30px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '0.5px' },
  subTitle: { color: '#64748B', fontSize: '14.5px', margin: '0 0 40px 0' },
  loading: { textAlign: 'center', padding: '120px 0', fontSize: '15px', color: '#64748B', fontWeight: '500', fontFamily: 'sans-serif' },
  contentLayout: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  leftColumn: { width: '25%', backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' },
  profileBox: { display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px', marginBottom: '20px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#2C3E50', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '700', fontSize: '20px', boxShadow: '0 4px 10px rgba(44,62,80,0.15)' },
  profileName: { margin: '2px 0 0 0', color: '#2C3E50', fontSize: '16px', fontWeight: '700' },
  sideMenu: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sideMenuBtn: { width: '100%', padding: '12px 16px', border: 'none', borderRadius: '10px', backgroundColor: 'transparent', color: '#475569', textAlign: 'left', fontSize: '14.5px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  sideMenuBtnActive: { backgroundColor: '#2C3E50', color: '#ffffff', boxShadow: '0 4px 12px rgba(44,62,80,0.2)' },
  rightColumn: { width: '75%', display: 'flex', flexDirection: 'column', gap: '24px' },
  emptyCard: { width: '100%', minHeight: '360px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', boxSizing: 'border-box', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' },
  emptyCardTitle: { fontSize: '24px', fontWeight: '700', color: '#2C3E50', margin: '0 0 12px 0' },
  emptyCardSub: { color: '#64748B', fontSize: '15px', margin: '0 0 32px 0', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' },
  orderNowBtn: { backgroundColor: '#E67E22', color: '#ffffff', border: 'none', padding: '14px 48px', borderRadius: '24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 4px 14px rgba(230,126,34,0.25)', transition: 'all 0.2s' },
  orderCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '20px' },
  orderIdText: { fontSize: '15.5px', fontWeight: '700', color: '#2C3E50', marginRight: '16px' },
  orderDate: { fontSize: '13.5px', color: '#64748B' },
  statusBadge: (status) => {
    const isStandardStatus = ['pending', 'processing', 'shipping', 'completed', 'cancelled'].includes(status);
    const finalStatus = isStandardStatus ? status : 'shipping';
    
    return {
      padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700',
      backgroundColor: finalStatus === 'pending' ? '#FEF3C7' : finalStatus === 'processing' ? '#E0F2FE' : finalStatus === 'shipping' ? '#E0E7FF' : finalStatus === 'completed' ? '#DCFCE7' : '#FEE2E2',
      color: finalStatus === 'pending' ? '#B45309' : finalStatus === 'processing' ? '#0369A1' : finalStatus === 'shipping' ? '#4338CA' : finalStatus === 'completed' ? '#15803D' : '#B91C1C',
    };
  },
  productContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  productRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' },
  productImg: { width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  productTitle: { margin: '0 0 6px 0', fontSize: '15px', color: '#2C3E50', fontWeight: '600', lineHeight: '1.4' },
  productQty: { margin: '0 0 10px 0', fontSize: '13.5px', color: '#64748B' },
  viewDetailBtn: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  productPrice: { fontWeight: '700', color: '#2C3E50', fontSize: '15.5px', display: 'block' },
  reviewBtn: { backgroundColor: '#ffffff', border: '1px solid #E67E22', color: '#E67E22', padding: '6px 14px', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer', fontWeight: '700', marginTop: '6px', transition: 'all 0.2s' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' },
  totalBlock: { fontSize: '14.5px', color: '#475569', fontWeight: '500' },
  totalPrice: { fontSize: '20px', fontWeight: '800', color: '#E67E22', marginLeft: '6px' },
  cancelBtn: { backgroundColor: '#ffffff', border: '1px solid #F3F4F6', color: '#EF4444', padding: '10px 20px', borderRadius: '8px', fontSize: '13.5px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  confirmBtn: { backgroundColor: '#2C3E50', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontSize: '13.5px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 10px rgba(44,62,80,0.15)', transition: 'all 0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2C3E50' },
  textarea: { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontSize: '14px', color: '#1E293B', fontFamily: 'sans-serif' },
  previewImg: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginTop: '6px', border: '1px solid #E2E8F0' },
  modalCloseBtn: { padding: '10px 22px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#ffffff', cursor: 'pointer', color: '#64748B', fontWeight: '600', transition: 'all 0.2s' },
  modalSubmitBtn: { padding: '10px 24px', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }
};

export default OrderHistoryPage;