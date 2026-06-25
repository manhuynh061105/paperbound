import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  }
});


API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export const userService = {
  register: (data) => API.post('/users/register', data),
  login: (data) => API.post('/users/login', data),
  getProfile: (id) => API.get(`/users/profile/${id}`),
  updateProfile: (id, data) => API.put(`/users/profile/${id}`, data),
};


export const productService = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data), 
  getRelated: (id) => API.get(`/products/${id}/related`), 
  getReviews: (productId) => API.get(`/products/${productId}/reviews`),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  getDashboardStats: () => API.get('/products/dashboard/stats'),
};


export const cartService = {
  getByUserId: (userId) => API.get(`/cart/${userId}`),
  add: (data) => API.post('/cart/add', data),
  deleteItem: (userId, productId) => API.delete(`/cart/${userId}/${productId}`),
  updateQuantity: (data) => API.put('/cart/update', data),
};


export const orderService = {
  create: (data) => API.post('/orders/checkout', data),
  getByUserId: (userId) => API.get(`/orders/user/${userId}`),
  updateStatus: (orderId, data) => API.put('/orders/' + orderId + '/status', data),
};

export const categoryService = {
  getAll: () => API.get('/categories'),
  create: (data) => API.post('/categories', data), 
};


export const reviewService = {
  create: (formData) => API.post('/reviews', formData, {
    headers: {
    }
  }),

  getByProductId: (productId) => API.get(`/reviews/${productId}/reviews`),
};


export const aiService = {
  sendMessage: (data) => API.post('/ai/send', data),

  getHistory: (userId) => API.get(`/ai/history/${userId}`),
};