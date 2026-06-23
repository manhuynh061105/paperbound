import axios from 'axios';

const API = axios.create({
  // Tự động lấy URL Backend theo môi trường (Local / Deploy)
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  }
});

// 1. DỊCH VỤ USER
export const userService = {
  register: (data) => API.post('/users/register', data),
  login: (data) => API.post('/users/login', data),
  getProfile: (id) => API.get(`/users/profile/${id}`),
  updateProfile: (id, data) => API.put(`/users/profile/${id}`, data),
};

// 2. DỊCH VỤ SẢN PHẨM
export const productService = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data), 
  getRelated: (id) => API.get(`/products/${id}/related`), 
  // ✅ ĐÃ SỬA: Thay 'axios.get' thành 'API.get' để chạy đúng URL Backend
  getReviews: (productId) => API.get(`/products/${productId}/reviews`),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

// 3. DỊCH VỤ GIỎ HÀNG
export const cartService = {
  getByUserId: (userId) => API.get(`/cart/${userId}`),
  add: (data) => API.post('/cart/add', data),
  deleteItem: (userId, productId) => API.delete(`/cart/${userId}/${productId}`),
  updateQuantity: (data) => API.put('/cart/update', data),
};

// 4. DỊCH VỤ ĐƠN HÀNG
export const orderService = {
  create: (data) => API.post('/orders/checkout', data),
  getByUserId: (userId) => API.get(`/orders/user/${userId}`),
  updateStatus: (orderId, data) => API.put(`/orders/${orderId}/status`, data),
};

// 5. DỊCH VỤ DANH MỤC
export const categoryService = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data), 
};

// 6. DỊCH VỤ ĐÁNH GIÁ (Gộp chung toàn bộ xử lý review về đây)
export const reviewService = {
  // Gửi FormData bao gồm text bình luận, số sao và file ảnh up lên backend
  create: (formData) => API.post('/reviews', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Bắt buộc cấu hình này để gửi được file kèm theo
    }
  }),

  // 💥 ĐÃ BỔ SUNG: Lấy danh sách nhận xét kèm ảnh từ Backend theo đúng mẫu Route mới
  getByProductId: (productId) => API.get(`/reviews/${productId}/reviews`),
};