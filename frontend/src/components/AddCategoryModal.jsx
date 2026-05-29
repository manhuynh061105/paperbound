import React, { useState } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';

const AddCategoryModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("⚠️ Tên danh mục không được để trống!");
      return;
    }

    setSubmitting(true);
    try {
      const response = await categoryService.create({ name, description });
      if (response.data.success) {
        toast.success(`✨ Đã thêm danh mục: "${name}" thành công!`);
        setName('');
        setDescription('');
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
      <div style={styles.modalBox}>
        <div style={styles.header}>
          <h3 style={styles.title}>📁 THÊM DANH MỤC SÁCH MỚI</h3>
          <button style={styles.closeTopBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.body}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tên danh mục (*):</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={styles.input} placeholder="Ví dụ: Truyện Trinh Thám" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mô tả danh mục:</label>
              <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} style={styles.textarea} placeholder="Mô tả ngắn gọn về nhóm sách này..." />
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
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #eee' },
  title: { margin: 0, fontSize: '15px', color: '#2C3E50', fontWeight: 'bold' },
  closeTopBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' },
  form: { display: 'flex', flexDirection: 'column' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#444' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' },
  textarea: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'Arial' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', borderTop: '1px solid #eee', backgroundColor: '#f8f9fa', borderRadius: '0 0 8px 8px' },
  cancelBtn: { padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' },
  submitBtn: { padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#2980b9', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }
};

export default AddCategoryModal;