import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';

const AddCategoryModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryType, setCategoryType] = useState('main'); 
  const [parentId, setParentId] = useState(''); 
  const [mainCategories, setMainCategories] = useState([]); 
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      categoryService.getAll()
        .then(res => {
          const allCats = res.data.data || res.data || [];
          const mains = allCats.filter(cat => !cat.parent_id);
          setMainCategories(mains);
        })
        .catch(err => {
          console.error("Lỗi lấy danh mục chính:", err);
          toast.error("❌ Không thể tải danh sách danh mục chính.");
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("⚠️ Tên danh mục không được để trống!");
      return;
    }

    if (categoryType === 'sub' && !parentId) {
      toast.warning("⚠️ Bạn phải chọn một Danh mục chính để ràng buộc danh mục con!");
      return;
    }

    setSubmitting(true);
    
    const payload = {
      name: name.trim(),
      description: description.trim(),
      parent_id: categoryType === 'sub' ? Number(parentId) : null
    };

    try {
      const response = await categoryService.create(payload);
      if (response.data.success || response.data) {
        toast.success(`✨ Đã thêm danh mục: "${name}" thành công!`);
        setName('');
        setDescription('');
        setCategoryType('main');
        setParentId('');
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Lỗi khi thêm danh mục mới: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox} className="modal-fade-in">
        <div style={styles.header}>
          <h3 style={styles.title}>📁 THÊM DANH MỤC SÁCH MỚI</h3>
          <button style={styles.closeTopBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.body}>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Cấp bậc danh mục:</label>
              <select 
                value={categoryType} 
                onChange={e => {
                  setCategoryType(e.target.value);
                  if (e.target.value === 'main') setParentId(''); 
                }} 
                style={styles.select}
              >
                <option value="main">Danh mục chính (Ví dụ: Văn Học, Kinh Tế)</option>
                <option value="sub">Danh mục con (Ví dụ: Tiểu Thuyết, Thơ)</option>
              </select>
            </div>

            {categoryType === 'sub' && (
              <div style={styles.inputGroup} className="input-slide-down">
                <label style={styles.label}>Thuộc danh mục chính (*):</label>
                <select 
                  value={parentId} 
                  onChange={e => setParentId(e.target.value)} 
                  required
                  style={{ ...styles.select, borderColor: '#F14D5C' }}
                >
                  <option value="">-- Chọn danh mục chính ràng buộc --</option>
                  {mainCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tên danh mục mới (*):</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                style={styles.input} 
                placeholder={categoryType === 'main' ? "Ví dụ: Văn Học Trong Nước" : "Ví dụ: Truyện Trinh Thám"} 
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mô tả danh mục:</label>
              <textarea 
                rows="3" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                style={styles.textarea} 
                placeholder="Mô tả ngắn gọn về nhóm sách này..." 
              />
            </div>
          </div>

          <div style={styles.footerActions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={submitting}>HỦY</button>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "ĐANG LƯU..." : "THÊM MỚI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001, backdropFilter: 'blur(3px)' },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '12px', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f2f6' },
  title: { margin: 0, fontSize: '14px', color: '#2C3E50', fontWeight: '800', letterSpacing: '0.5px' },
  closeTopBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' },
  form: { display: 'flex', flexDirection: 'column' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12.5px', fontWeight: 'bold', color: '#333' },
  input: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', outline: 'none', transition: 'all 0.2s' },
  select: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.2s' },
  textarea: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13.5px', outline: 'none', resize: 'none', fontFamily: 'Arial, sans-serif', transition: 'all 0.2s' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #f1f2f6', backgroundColor: '#f8f9fa' },
  cancelBtn: { padding: '9px 18px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#666', transition: 'all 0.2s' },
  
  submitBtn: { padding: '9px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#F14D5C', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(241, 77, 92, 0.2)', transition: 'all 0.2s' }
};

export default AddCategoryModal;