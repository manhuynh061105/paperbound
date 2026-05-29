import axios from 'axios';

const API = axios.create({
  // Vite sẽ tự động chọn URL phù hợp: chạy local sẽ lấy localhost, khi deploy lên Vercel/Netlify nó sẽ lấy URL trên đó
  baseURL: import.meta.env.VITE_API_BASE_URL, 
});

export const userService = {
  register: (data) => API.post('/users/register', data),
  login: (data) => API.post('/users/login', data),
  getProfile: (id) => API.get(`/users/profile/${id}`),
  updateProfile: (id, data) => API.put(`/users/profile/${id}`, data),
};

// ... các hàm productService, cartService giữ nguyên như cũ ...
// Thêm hàm "create" vào trong cụm cấu hình productService
export const productService = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data), // <-- BỔ SUNG DÒNG NÀY
};

export const cartService = {
  getByUserId: (userId) => API.get(`/cart/${userId}`),
  add: (data) => API.post('/cart/add', data),
  deleteItem: (userId, productId) => API.delete(`/cart/${userId}/${productId}`),
  updateQuantity: (data) => API.put('/cart/update', data),
};

export const orderService = {
  checkout: (data) => API.post('/orders/checkout', data),
};

export const categoryService = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data), // Phục vụ tính năng thêm danh mục ở bước sau
};

