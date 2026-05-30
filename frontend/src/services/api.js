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

// 2. DỊCH VỤ SẢN PHẨM (Gộp chung tất cả vào đây để tránh lỗi trùng lặp biến)
export const productService = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data), 
  getRelated: (id) => API.get(`/products/${id}/related`), // 💡 BỔ SUNG: Phục vụ trang chi tiết sách
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
};

// 5. DỊCH VỤ DANH MỤC
export const categoryService = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data), 
};