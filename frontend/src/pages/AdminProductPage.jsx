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
      console.error(error);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Vui lòng chỉ chọn tệp tin hình ảnh!");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dung lượng ảnh quá lớn (Vui lòng chọn ảnh dưới 2MB)!");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
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
      const errorMsg = error.response?.data?.message || "Cập nhật thất bại, hãy kiểm tra lại Backend!";
      toast.error(errorMsg);
      console.error(error);
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
        <p style={{ color: '#64748B', fontWeight: '500' }}>Đang kết nối cơ sở dữ liệu quản trị...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{animationStyles}</style>
      <div style={styles.mainHeader}>
        <div>
          <h2 style={styles.pageTitle}>⚙️ Hệ Thống Quản Trị Kho Hàng</h2>
          <p style={styles.pageSubtitle}>Quản lý, chỉnh sửa thông tin và điều phối số lượng tồn kho sản phẩm</p>
        </div>
        <div style={styles.statsBadge}>Tổng số: <b>{products.length}</b> đầu sách</div>
      </div>

      <div style={styles.dashboardLayout}>
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
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{...styles.categoryMenuItem, ...(selectedCategory === cat.id ? styles.categoryActive : {})}} className="category-item-hover">
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
                    <tr key={p.id} style={styles.trBody} className="table-row-hover">
                      <td style={{...styles.td, color: '#94A3B8', fontWeight: 'bold'}}>#{p.id}</td>
                      <td style={styles.td}>
                        <img src={p.cover_image || 'https://via.placeholder.com/50x70?text=Book'} alt={p.title} style={styles.productMiniImg} />
                      </td>
                      <td style={styles.td}>
                        <div style={styles.titleColumn}>
                          <span style={styles.productTitleText}>{p.title}</span>
                          <span style={styles.productAuthorText}>Tác giả: {p.author || 'Chưa rõ'}</span>
                        </div>
                      </td>
                      <td style={{...styles.td, color: '#E67E22', fontWeight: '700'}}>{Number(p.price).toLocaleString('vi-VN')} đ</td>
                      <td style={styles.td}>
                        {p.stock_quantity > 0 ? <span style={styles.badgeInStock}>Còn {p.stock_quantity} cuốn</span> : <span style={styles.badgeOutStock}>Hết hàng</span>}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionBtnGroup}>
                          <button onClick={() => openEditModal(p)} style={styles.editBtn} className="action-btn">✏️ Sửa</button>
                          <button onClick={() => handleDelete(p.id, p.title)} style={styles.deleteBtn} className="action-btn">🗑️ Xóa</button>
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

              <div style={{...styles.formGroup, gridColumn: 'span 2'}}>
                <label style={styles.label}>Ảnh bìa tác phẩm</label>
                <div style={styles.imageUploadWrapper}>
                  <div style={styles.imagePreviewContainer}>
                    <img 
                      src={editingProduct.cover_image || 'https://via.placeholder.com/100x140?text=No+Image'} 
                      alt="Xem trước ảnh bìa" 
                      style={styles.imagePreview} 
                    />
                  </div>
                  <div style={styles.uploadActions}>
                    <input 
                      type="file" 
                      id="coverImageUpload" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="coverImageUpload" style={styles.uploadBtnLabel} className="upload-label-hover">
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
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.cancelBtn} className="modal-btn">Hủy bỏ</button>
                <button type="submit" style={styles.saveBtn} className="modal-btn">💾 Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const animationStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .table-row-hover {
    transition: background-color 0.2s ease !important;
  }
  .table-row-hover:hover {
    background-color: #F8FAFC !important;
  }
  .category-item-hover {
    transition: all 0.2s ease !important;
  }
  .category-item-hover:hover {
    background-color: #F1F5F9 !important;
    padding-left: 16px !important;
  }
  .action-btn, .modal-btn, .upload-label-hover {
    transition: all 0.2s ease !important;
  }
  .action-btn:hover, .modal-btn:hover {
    transform: translateY(-1px);
    filter: brightness(0.95);
  }
  .upload-label-hover:hover {
    background-color: #2C3E50 !important;
    color: #ffffff !important;
    border-color: #2C3E50 !important;
  }
`;

const styles = {
  container: { padding: '40px 4%', backgroundColor: '#FAFAFA', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, sans-serif' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' },
  pageTitle: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#2C3E50', letterSpacing: '-0.5px' },
  pageSubtitle: { margin: '6px 0 0 0', fontSize: '14px', color: '#64748B' },
  statsBadge: { backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', padding: '10px 22px', borderRadius: '30px', fontSize: '14px', color: '#2C3E50' },
  dashboardLayout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '35px', alignItems: 'start' },
  sidebarFilter: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '22px', position: 'sticky', top: '30px' },
  filterMenuTitle: { margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#2C3E50', borderBottom: '2px solid #F1F5F9', paddingBottom: '12px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  filterLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  filterInput: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', color: '#2C3E50' },
  filterSelect: { padding: '11px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', backgroundColor: '#ffffff', outline: 'none', cursor: 'pointer', color: '#2C3E50' },
  categoryMenu: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' },
  categoryMenuItem: { border: 'none', backgroundColor: 'transparent', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', fontSize: '13.5px', color: '#475569', fontWeight: '600', cursor: 'pointer' },
  categoryActive: { backgroundColor: '#FFF7ED', color: '#E67E22', fontWeight: '700', borderLeft: '3px solid #E67E22', borderRadius: '0 8px 8px 0' },
  mainContent: { display: 'flex', flexDirection: 'column' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  th: { padding: '18px 20px', fontSize: '12.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  trBody: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#334155', verticalAlign: 'middle' },
  titleColumn: { display: 'flex', flexDirection: 'column', gap: '4px' },
  productTitleText: { fontWeight: '700', color: '#2C3E50', fontSize: '15px' },
  productAuthorText: { fontSize: '13px', color: '#64748B' },
  productMiniImg: { width: '48px', height: '66px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 4px 12px rgba(44,62,80,0.08)' },
  badgeInStock: { backgroundColor: '#ECFDF5', color: '#10B981', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
  badgeOutStock: { backgroundColor: '#FEF2F2', color: '#EF4444', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
  actionBtnGroup: { display: 'flex', gap: '8px', justifyContent: 'center' },
  editBtn: { backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  emptyState: { padding: '50px 0', textAlign: 'center', color: '#64748B' },
  emptyTd: { textAlign: 'center', padding: '50px' },
  centerBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: '20px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTop: '4px solid #E67E22', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#ffffff', padding: '35px', borderRadius: '16px', width: '100%', maxWidth: '680px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #E2E8F0' },
  modalTitle: { margin: '0 0 24px 0', fontSize: '19px', fontWeight: '800', color: '#2C3E50', borderLeft: '4px solid #E67E22', paddingLeft: '12px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  input: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', backgroundColor: '#F8FAFC', color: '#2C3E50' },
  textarea: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', backgroundColor: '#F8FAFC', color: '#2C3E50' },
  modalActionRow: { gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' },
  cancelBtn: { backgroundColor: '#F1F5F9', color: '#475569', border: 'none', padding: '11px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  saveBtn: { backgroundColor: '#2C3E50', color: '#ffffff', border: 'none', padding: '11px 26px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(44,62,80,0.15)' },
  imageUploadWrapper: { display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '12px', border: '1px dashed #CBD5E1' },
  imagePreviewContainer: { width: '80px', height: '110px', backgroundColor: '#E2E8F0', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadActions: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  uploadBtnLabel: { display: 'inline-block', padding: '10px 16px', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  uploadNote: { fontSize: '12px', color: '#64748B', lineHeight: '1.4' }
};

export default AdminProductPage;