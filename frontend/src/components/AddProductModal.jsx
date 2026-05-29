import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('5.0');
  const [coverImage, setCoverImage] = useState('');
  
  // State lưu danh mục động từ DB
  const [dbCategories, setDbCategories] = useState([]);

  // Tải danh mục từ Database khi mở Modal
  useEffect(() => {
    if (isOpen) {
      categoryService.getAll()
        .then(res => {
          const cats = res.data.data || res.data || [];
          setDbCategories(cats);
          if (cats.length > 0) {
            setCategoryId(cats[0].id); // Mặc định chọn danh mục đầu tiên
          }
        })
        .catch(err => {
          console.error("Lỗi lấy danh mục:", err);
          toast.error("❌ Không thể tải danh mục từ hệ thống!");
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    
    if (!categoryId) {
      toast.warning("⚠️ Vui lòng chọn danh mục cho sách!");
      return;
    }

    const newProduct = {
      title,
      author,
      price: parseFloat(price),
      tax_rate: 0, 
      category_id: parseInt(categoryId), // Truyền chuẩn ID danh mục từ DB
      description,
      rating: parseFloat(rating),
      cover_image: coverImage
    };

    onAdd(newProduct);
    
    // Reset Form
    setTitle(''); setAuthor(''); setPrice('');
    setDescription(''); setRating('5.0'); setCoverImage('');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox}>
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
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Giá bán (VNĐ) (*):</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} required style={styles.input} placeholder="Giá tiền số" />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Điểm đánh giá (1.0 - 5.0):</label>
                <input type="number" step="0.1" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} style={styles.input} />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Danh mục sách (*):</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required style={styles.input}>
                {dbCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #eee' },
  title: { margin: 0, fontSize: '16px', color: '#2C3E50', fontWeight: 'bold' },
  closeTopBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' },
  form: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  scrollContainer: { padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh' },
  row: { display: 'flex', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#444' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' },
  fileInput: { fontSize: '13px', color: '#555' },
  previewContainer: { marginTop: '5px', textAlign: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' },
  previewImg: { height: '110px', objectFit: 'contain', borderRadius: '4px' },
  textarea: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'Arial' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', borderTop: '1px solid #eee', backgroundColor: '#f8f9fa', borderRadius: '0 0 8px 8px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#666' },
  submitBtn: { padding: '10px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#E67E22', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }
};

export default AddProductModal;