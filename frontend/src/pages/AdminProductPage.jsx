import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api'; 
import { toast } from 'react-toastify';

const AdminProductPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id-asc');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productRes, categoryRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);

      const prodData = productRes?.data?.data || productRes?.data || [];
      setProducts(Array.isArray(prodData) ? prodData : []);

      const catData = categoryRes?.data?.data || categoryRes?.data || [];
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu hệ thống:", error);
      toast.error("Không thể tải danh sách sản phẩm hoặc danh mục!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa cuốn sách "${title}" không?`)) {
      try {
        await productService.delete(id);
        toast.success("🗑️ Đã xóa sản phẩm thành công!");
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || "Xóa sản phẩm thất bại!");
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: value }));
  };

  // 💥 HÀM XỬ LÝ CHỌN FILE ẢNH & CHUYỂN THÀNH BASE64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra định dạng file phải là ảnh
      if (!file.type.startsWith('image/')) {
        toast.error("Vui lòng chỉ chọn tệp tin hình ảnh!");
        return;
      }
      // Kiểm tra dung lượng file (Ví dụ chặn > 2MB để tránh quá tải DB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dung lượng ảnh quá lớn (Vui lòng chọn ảnh dưới 2MB)!");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result chính là chuỗi Base64 mã hóa của hình ảnh
        setEditingProduct(prev => ({ ...prev, cover_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingProduct,
        price: Number(editingProduct.price),
        stock_quantity: Number(editingProduct.stock_quantity),
        category_id: editingProduct.category_id ? Number(editingProduct.category_id) : null
      };

      await productService.update(editingProduct.id, payload);
      toast.success("✨ Cập nhật thông tin sách thành công!");
      setIsEditModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      // Hiện thông báo lỗi chi tiết từ backend nếu có để dễ debug
      const errorMsg = error.response?.data?.message || "Cập nhật thất bại, hãy kiểm tra lại Backend!";
      toast.error(errorMsg);
      console.error("Lỗi cập nhật chi tiết:", error);
    }
  };

  const filteredAndSortedProducts = products
    .filter(p => {
      if (!p) return false;
      const matchesSearch = (p.title?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                            (p.author?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || 
        (p.category_ids && Array.isArray(p.category_ids) && p.category_ids.map(Number).includes(Number(selectedCategory))) ||
        (p.category_id && Number(p.category_id) === Number(selectedCategory));

      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'in-stock' && p.stock_quantity > 0) ||
        (stockFilter === 'out-stock' && (p.stock_quantity === undefined || p.stock_quantity <= 0));

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'stock-desc') return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      return a.id - b.id;
    });

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#7f8c8d', fontWeight: '500' }}>Đang kết nối cơ sở dữ liệu quản trị...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainHeader}>
        <div>
          <h2 style={styles.pageTitle}>⚙️ Hệ Thống Quản Trị Kho Hàng</h2>
          <p style={styles.pageSubtitle}>Quản lý, chỉnh sửa thông tin và điều phối số lượng tồn kho sản phẩm</p>
        </div>
        <div style={styles.statsBadge}>Tổng số: <b>{products.length}</b> đầu sách</div>
      </div>

      <div style={styles.dashboardLayout}>
        {/* SIDEBAR BỘ LỌC */}
        <div style={styles.sidebarFilter}>
          <h3 style={styles.filterMenuTitle}>📋 Bộ Lọc Tìm Kiếm</h3>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Từ khóa tìm kiếm</label>
            <input type="text" placeholder="Tên sách, tác giả..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.filterInput} />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Thể loại tác phẩm ({categories.length})</label>
            <div style={styles.categoryMenu}>
              <button onClick={() => setSelectedCategory('all')} style={{...styles.categoryMenuItem, ...(selectedCategory === 'all' ? styles.categoryActive : {})}}>📚 Tất cả thể loại</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{...styles.categoryMenuItem, ...(selectedCategory === cat.id ? styles.categoryActive : {})}}>
                  📖 {cat.name || cat.category_name}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Trạng thái tồn kho</label>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">Tất cả sản phẩm</option>
              <option value="in-stock">🟢 Còn hàng trong kho</option>
              <option value="out-stock">🔴 Đã hết hàng</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sắp xếp danh sách</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.filterSelect}>
              <option value="id-asc">Mặc định (ID cũ - mới)</option>
              <option value="price-asc">Giá bán: Thấp đến Cao</option>
              <option value="price-desc">Giá bán: Cao đến Thấp</option>
              <option value="stock-desc">Số lượng kho: Giảm dần</option>
            </select>
          </div>
        </div>

        {/* BẢNG SẢN PHẨM PHẢI */}
        <div style={styles.mainContent}>
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{...styles.th, width: '60px'}}>ID</th>
                  <th style={{...styles.th, width: '80px'}}>Hình ảnh</th>
                  <th style={styles.th}>Thông tin tác phẩm</th>
                  <th style={{...styles.th, width: '130px'}}>Giá niêm yết</th>
                  <th style={{...styles.th, width: '130px'}}>Kho hàng</th>
                  <th style={{...styles.th, width: '150px', textAlign: 'center'}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTd}>
                      <div style={styles.emptyState}><span>🔍</span><p>Không tìm thấy cuốn sách nào khớp với điều kiện lọc hiện tại.</p></div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedProducts.map(p => (
                    <tr key={p.id} style={styles.trBody}>
                      <td style={{...styles.td, color: '#95A5A6', fontWeight: 'bold'}}>#{p.id}</td>
                      <td style={styles.td}>
                        <img src={p.cover_image || 'https://via.placeholder.com/50x70?text=Book'} alt={p.title} style={styles.productMiniImg} />
                      </td>
                      <td style={styles.td}>
                        <div style={styles.titleColumn}>
                          <span style={styles.productTitleText}>{p.title}</span>
                          <span style={styles.productAuthorText}>Tác giả: {p.author || 'Chưa rõ'}</span>
                        </div>
                      </td>
                      <td style={{...styles.td, color: '#F14D5C', fontWeight: '700'}}>{Number(p.price).toLocaleString('vi-VN')} đ</td>
                      <td style={styles.td}>
                        {p.stock_quantity > 0 ? <span style={styles.badgeInStock}>Còn {p.stock_quantity} cuốn</span> : <span style={styles.badgeOutStock}>Hết hàng</span>}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionBtnGroup}>
                          <button onClick={() => openEditModal(p)} style={styles.editBtn}>✏️ Sửa</button>
                          <button onClick={() => handleDelete(p.id, p.title)} style={styles.deleteBtn}>🗑️ Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL POP-UP CẬP NHẬT SẢN PHẨM */}
      {isEditModalOpen && editingProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>📝 Cập nhật thông tin tác phẩm</h3>
            <form onSubmit={handleUpdateSubmit} style={styles.formGrid}>
              
              <div style={{...styles.formGroup, gridColumn: 'span 2'}}>
                <label style={styles.label}>Tên đầu sách *</label>
                <input type="text" name="title" value={editingProduct.title || ''} onChange={handleInputChange} required style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tác giả</label>
                <input type="text" name="author" value={editingProduct.author || ''} onChange={handleInputChange} style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Giá bán (đ) *</label>
                <input type="number" name="price" value={editingProduct.price || 0} onChange={handleInputChange} required style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Số lượng trong kho *</label>
                <input type="number" name="stock_quantity" value={editingProduct.stock_quantity || 0} onChange={handleInputChange} required style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Thể loại chính</label>
                <select name="category_id" value={editingProduct.category_id || ''} onChange={handleInputChange} style={styles.filterSelect}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name || cat.category_name}</option>
                  ))}
                </select>
              </div>

              {/* 💥 KHU VỰC TẢI ẢNH MỚI: THAY Ô INPUT TEXT BẰNG NÚT CHỌN TỆP FILE VÀ PREVIEW */}
              <div style={{...styles.formGroup, gridColumn: 'span 2'}}>
                <label style={styles.label}>Ảnh bìa tác phẩm</label>
                <div style={styles.imageUploadWrapper}>
                  {/* Khối hiển thị ảnh xem trước trực tiếp */}
                  <div style={styles.imagePreviewContainer}>
                    <img 
                      src={editingProduct.cover_image || 'https://via.placeholder.com/100x140?text=No+Image'} 
                      alt="Xem trước ảnh bìa" 
                      style={styles.imagePreview} 
                    />
                  </div>
                  {/* Khối nút chọn file thiết kế hiện đại */}
                  <div style={styles.uploadActions}>
                    <input 
                      type="file" 
                      id="coverImageUpload" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="coverImageUpload" style={styles.uploadBtnLabel}>
                      📁 Chọn tệp ảnh mới...
                    </label>
                    <span style={styles.uploadNote}>Hỗ trợ file: JPG, PNG, WEBP. Tối đa 2MB.</span>
                  </div>
                </div>
              </div>

              <div style={{...styles.formGroup, gridColumn: 'span 2'}}>
                <label style={styles.label}>Tóm tắt nội dung cuốn sách</label>
                <textarea name="description" rows="4" value={editingProduct.description || ''} onChange={handleInputChange} style={styles.textarea}></textarea>
              </div>

              <div style={styles.modalActionRow}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.cancelBtn}>Hủy bỏ</button>
                <button type="submit" style={styles.saveBtn}>💾 Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= STYLESHEET (BỔ SUNG THÊM CSS CHO KHỐI UPLOAD) =================
const styles = {
  container: { padding: '40px 6%', backgroundColor: '#F4F6F8', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#1A2530', letterSpacing: '-0.5px' },
  pageSubtitle: { margin: '4px 0 0 0', fontSize: '13.5px', color: '#7F8C8D' },
  statsBadge: { backgroundColor: '#FFF5F6', border: '1px solid #FDF2F3', padding: '10px 20px', borderRadius: '30px', fontSize: '14px', color: '#F14D5C' },
  dashboardLayout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', alignItems: 'start' },
  sidebarFilter: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '20px' },
  filterMenuTitle: { margin: '0 0 5px 0', fontSize: '16px', fontWeight: '800', color: '#2C3E50', borderBottom: '2px solid #F2F4F5', paddingBottom: '12px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  filterLabel: { fontSize: '12.5px', fontWeight: '700', color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: '0.5px' },
  filterInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '13.5px', outline: 'none' },
  filterSelect: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '13.5px', backgroundColor: '#ffffff', outline: 'none', cursor: 'pointer' },
  categoryMenu: { display: 'flex', flexDirection: 'column', gap: '6px' },
  categoryMenuItem: { border: 'none', backgroundColor: 'transparent', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', fontSize: '13.5px', color: '#566573', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  categoryActive: { backgroundColor: '#FFF5F6', color: '#F14D5C', fontWeight: '700' },
  mainContent: { display: 'flex', flexDirection: 'column' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E8E8' },
  th: { padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#7F8C8D', textTransform: 'uppercase' },
  trBody: { borderBottom: '1px solid #F2F4F5', transition: 'background 0.2s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#2C3E50', verticalAlign: 'middle' },
  titleColumn: { display: 'flex', flexDirection: 'column', gap: '4px' },
  productTitleText: { fontWeight: '600', color: '#1A2530', fontSize: '14.5px' },
  productAuthorText: { fontSize: '12.5px', color: '#95A5A6' },
  productMiniImg: { width: '45px', height: '62px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  badgeInStock: { backgroundColor: '#E8F8F5', color: '#2ECC71', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
  badgeOutStock: { backgroundColor: '#FADBD8', color: '#E74C3C', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
  actionBtnGroup: { display: 'flex', gap: '8px', justifyContent: 'center' },
  editBtn: { backgroundColor: '#EBF5FB', color: '#2980B9', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#FADBD8', color: '#C0392B', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  emptyState: { padding: '50px 0', textAlign: 'center', color: '#95A5A6' },
  emptyTd: { textAlign: 'center', padding: '40px' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '15px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #F14D5C', borderRadius: '50%' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26, 37, 48, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: '#ffffff', padding: '35px', borderRadius: '16px', width: '100%', maxWidth: '650px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: '0 0 22px 0', fontSize: '18px', fontWeight: '800', color: '#1A2530', borderLeft: '4px solid #F14D5C', paddingLeft: '12px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#566573' },
  input: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '14px', outline: 'none', backgroundColor: '#FAFAFA' },
  textarea: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #D5DBDB', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', backgroundColor: '#FAFAFA' },
  modalActionRow: { gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid #F2F4F5', paddingTop: '20px' },
  cancelBtn: { backgroundColor: '#F2F4F5', color: '#566573', border: 'none', padding: '11px 22px', borderRadius: '30px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { backgroundColor: '#F14D5C', color: '#ffffff', border: 'none', padding: '11px 26px', borderRadius: '30px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 6px 20px rgba(241,77,92,0.2)' },
  
  // 💥 CSS MỚI CHO PHẦN UPLOAD FILE ẢNH VÀ XEM TRƯỚC (PREVIEW)
  imageUploadWrapper: { display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#FAFAFA', padding: '15px', borderRadius: '12px', border: '1px dashed #D5DBDB' },
  imagePreviewContainer: { width: '80px', height: '110px', backgroundColor: '#EAEDED', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadActions: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  uploadBtnLabel: { display: 'inline-block', padding: '10px 16px', backgroundColor: '#ffffff', color: '#2C3E50', border: '1px solid #D5DBDB', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  uploadNote: { fontSize: '12px', color: '#95A5A6', lineHeight: '1.4' }
};

export default AdminProductPage;