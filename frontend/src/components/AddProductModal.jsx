import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('5.0');
  const [stockQuantity, setStockQuantity] = useState('10'); 
  const [coverImage, setCoverImage] = useState('');
  
  const [selectedCategories, setSelectedCategories] = useState(['']);
  
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      categoryService.getAll()
        .then(res => {
          const cats = res.data.data || res.data || [];
          
          const mains = cats.filter(c => !c.parent_id);
          const structured = [];
          
          mains.forEach(main => {
            structured.push({ ...main, isHeader: true, displayName: `📂 ${main.name.toUpperCase()}` });
            
            const subs = cats.filter(sub => Number(sub.parent_id) === Number(main.id));
            subs.forEach(sub => {
              structured.push({ ...sub, isHeader: false, displayName: `— 📄 ${sub.name}` });
            });
          });
          
          setHierarchicalCategories(structured);
        })
        .catch(err => {
          console.error("Lỗi lấy danh mục:", err);
          toast.error("❌ Không thể tải danh mục từ hệ thống!");
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCategoryRow = () => {
    setSelectedCategories([...selectedCategories, '']);
  };

  const handleRemoveCategoryRow = (index) => {
    if (selectedCategories.length === 1) {
      toast.warning("⚠️ Sản phẩm phải thuộc ít nhất một danh mục!");
      return;
    }
    const updated = selectedCategories.filter((_, i) => i !== index);
    setSelectedCategories(updated);
  };

  const handleCategoryChange = (index, value) => {
    const updated = [...selectedCategories];
    updated[index] = value;
    setSelectedCategories(updated);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("⚠️ File ảnh bìa không được vượt quá 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validCategoryIds = selectedCategories
      .filter(id => id !== '')
      .map(id => parseInt(id, 10));

    const uniqueCategoryIds = [...new Set(validCategoryIds)];

    if (uniqueCategoryIds.length === 0) {
      toast.warning("⚠️ Vui lòng chọn ít nhất một danh mục hợp lệ cho sách!");
      return;
    }

    const parsedStock = parseInt(stockQuantity, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.warning("⚠️ Số lượng tồn kho không được để trống và phải lớn hơn hoặc bằng 0!");
      return;
    }

    const newProduct = {
      title: title.trim(),
      author: author.trim(),
      price: parseFloat(price),
      tax_rate: 5, 
      stock_quantity: parsedStock, 
      category_ids: uniqueCategoryIds, 
      description: description.trim(),
      rating: parseFloat(rating),
      cover_image: coverImage
    };

    onAdd(newProduct);
    
    setTitle(''); setAuthor(''); setPrice('');
    setDescription(''); setRating('5.0'); setStockQuantity('10'); setCoverImage('');
    setSelectedCategories(['']);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox} className="modal-fade-in">
        <div style={styles.header}>
          <h3 style={styles.title}>📚 THÊM SÁCH MỚI VÀO CỬA HÀNG</h3>
          <button style={styles.closeTopBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.scrollContainer}>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tựa đề sách (*):</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={styles.input} placeholder="Ví dụ: Đắc Nhân Tâm" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tác giả (*):</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)} required style={styles.input} placeholder="Ví dụ: Dale Carnegie" />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1.2 }}>
                <label style={styles.label}>Giá bán (VNĐ) (*):</label>
                <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required style={styles.input} placeholder="Giá tiền số" />
              </div>
              <div style={{ ...styles.inputGroup, flex: 0.9 }}>
                <label style={styles.label}>Điểm số (1-5):</label>
                <input type="number" step="0.1" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} style={styles.input} />
              </div>
              <div style={{ ...styles.inputGroup, flex: 0.9 }}>
                <label style={styles.label}>Số lượng kho (*):</label>
                <input type="number" min="0" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required style={styles.input} placeholder="Ví dụ: 50" />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.categoryLabelRow}>
                <label style={styles.label}>Thuộc các danh mục sách (*):</label>
                <button type="button" onClick={handleAddCategoryRow} style={styles.addCategoryBtn}>
                  ➕ Thêm danh mục khác
                </button>
              </div>

              <div style={styles.categoryFieldsWrapper}>
                {selectedCategories.map((currentId, index) => (
                  <div key={index} style={styles.dynamicRow} className="input-slide-down">
                    <select 
                      value={currentId} 
                      onChange={e => handleCategoryChange(index, e.target.value)} 
                      required 
                      style={{ ...styles.input, flex: 1 }}
                    >
                      <option value="">-- Chọn danh mục sách --</option>
                      {hierarchicalCategories.map(cat => (
                        <option 
                          key={cat.id} 
                          value={cat.id}
                          style={{
                            fontWeight: cat.isHeader ? 'bold' : 'normal',
                            color: cat.isHeader ? '#2C3E50' : '#555',
                            backgroundColor: cat.isHeader ? '#f8f9fa' : '#ffffff'
                          }}
                        >
                          {cat.displayName}
                        </option>
                      ))}
                    </select>
                    {selectedCategories.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCategoryRow(index)} 
                        style={styles.deleteRowBtn}
                        title="Xóa danh mục này"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tải lên hình ảnh bìa sách:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={styles.fileInput} />
              {coverImage && (
                <div style={styles.previewContainer}>
                  <img src={coverImage} alt="Preview Cover" style={styles.previewImg} />
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mô tả / Tóm tắt nội dung sách:</label>
              <textarea rows="4" value={description} onChange={e => setDescription(e.target.value)} style={styles.textarea} placeholder="Nhập trích đoạn giới thiệu ngắn..." />
            </div>
          </div>

          <div style={styles.footerActions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>HỦY BỎ</button>
            <button type="submit" style={styles.submitBtn}>XÁC NHẬN THÊM</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '12px', width: '95%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', overflow: 'hidden' }, // Tăng nhẹ maxWidth lên 600px để hàng ngang 3 ô hiển thị thoải mái nhất
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f2f6' },
  title: { margin: 0, fontSize: '15px', color: '#2C3E50', fontWeight: '800', letterSpacing: '0.5px' },
  closeTopBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' },
  form: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  scrollContainer: { padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh' },
  row: { display: 'flex', gap: '12px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12.5px', fontWeight: 'bold', color: '#333' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box' },
  categoryLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  addCategoryBtn: { backgroundColor: '#fff', border: '1px dashed #F14D5C', color: '#F14D5C', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' },
  categoryFieldsWrapper: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #f1f2f6' },
  dynamicRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  deleteRowBtn: { backgroundColor: '#fce4e4', border: 'none', color: '#e74c3c', width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.15s' },
  fileInput: { fontSize: '13px', color: '#555' },
  previewContainer: { marginTop: '5px', textAlign: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' },
  previewImg: { height: '110px', objectFit: 'contain', borderRadius: '4px' },
  textarea: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', outline: 'none', resize: 'vertical', fontFamily: 'Arial, sans-serif' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #f1f2f6', backgroundColor: '#f8f9fa' },
  cancelBtn: { padding: '9px 18px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#666', transition: 'all 0.2s' },
  submitBtn: { padding: '9px 22px', borderRadius: '20px', border: 'none', backgroundColor: '#F14D5C', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(241, 77, 92, 0.2)', transition: 'all 0.2s' }
};

export default AddProductModal;