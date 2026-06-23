import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import các Components
import Header from './components/Header';
import Footer from './components/Footer';
import AddProductModal from './components/AddProductModal';
import AddCategoryModal from './components/AddCategoryModal';

// Import các Pages
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import MenuPage from './pages/MenuPage';
import OrderHistoryPage from './pages/OrderHistoryPage';

// Import Services
import { cartService, productService } from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [cartCount, setCartCount] = useState(0); 
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productTrigger, setProductTrigger] = useState(0);

  const userId = currentUser ? currentUser.id : null;
  const userRole = currentUser ? currentUser.role : 'customer';

  const refreshCartCount = () => {
    if (!userId) {
      setCartCount(0);
      return;
    }
    cartService.getByUserId(userId)
      .then(res => {
        const items = res.data.data || [];
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
      })
      .catch(err => console.error("Lỗi đồng bộ số lượng giỏ hàng:", err));
  };

  useEffect(() => {
    refreshCartCount();
  }, [userId]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCartCount(0);
    toast.info("ℹ️ Đã đăng xuất khỏi hệ thống.");
  };

  const handleAddNewProduct = async (newProduct) => {
    try {
      const response = await productService.create(newProduct);
      if (response.data.success) {
        toast.success(`🎉 Thêm thành công cuốn sách: "${newProduct.title}" vào Database!`);
        setProductTrigger(prev => prev + 1);
        setIsAdminModalOpen(false);
      }
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm qua API:", error);
      const errorMsg = error.response?.data?.message || error.message || "Không thể kết nối tới máy chủ!";
      toast.error(`❌ Thêm thất bại: ${errorMsg}`);
    }
  };

  // ====================================================================
  // 💡 ĐÃ SỬA CHUẨN: Đồng bộ key camelCase (userId, productId) theo đúng Backend Controller
  // ====================================================================
  const handleAddToCart = async (product, quantity) => {
    if (!userId) {
      toast.warning("⚠️ Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    try {
      const payload = {
        userId: Number(userId),         // Sửa từ user_id thành userId
        productId: Number(product.id),  // Sửa từ product_id thành productId
        quantity: Number(quantity)
      };

      const response = await cartService.add(payload);
      if (response.data.success || response.data) {
        // Gọi làm mới số lượng giỏ hàng lập tức
        refreshCartCount();
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("❌ Không thể thêm sản phẩm vào giỏ hàng!");
    }
  };

  return (
    <Router>
      <div style={styles.appWrapper}>
        <Header 
          cartCount={cartCount} 
          userRole={userRole} 
          currentUser={currentUser} 
          openAdminModal={() => setIsAdminModalOpen(true)}
          openCategoryModal={() => setIsCategoryModalOpen(true)} 
          onLogout={handleLogout} 
        />

        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<HomePage refreshCartCount={refreshCartCount} productTrigger={productTrigger} />} />
            <Route path="/cart" element={<CartPage refreshCartCount={refreshCartCount} />} />
            <Route path="/checkout" element={<CheckoutPage refreshCartCount={refreshCartCount} />} />
            <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/products" element={<MenuPage refreshCartCount={refreshCartCount} />} />
            <Route path="/orders-history" element={<OrderHistoryPage />} />
            
            {/* 💡 ĐÃ SỬA CHUẨN: Bổ sung prop refreshCartCount để trang chi tiết thực thi đồng bộ số lượng lên Header */}
            <Route 
              path="/products/:id" 
              element={
                <ProductDetailPage 
                  onAddToCart={handleAddToCart} 
                  refreshCartCount={refreshCartCount} 
                  currentUser={currentUser} 
                />
              } 
            />
          </Routes>
        </main>

        <AddProductModal 
          isOpen={isAdminModalOpen} 
          onClose={() => setIsAdminModalOpen(false)} 
          onAdd={handleAddNewProduct}
        />
        <AddCategoryModal 
          isOpen={isCategoryModalOpen} 
          onClose={() => setIsCategoryModalOpen(false)} 
        />

        <Footer />

        <ToastContainer 
          position="top-right" 
          autoClose={2000} 
          hideProgressBar={false} 
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}

const styles = {
  appWrapper: { 
    backgroundColor: '#F8F9FA', 
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
  },
  mainContent: { 
    flex: 1, 
    padding: '40px 5%', 
    marginBottom: '60px' 
  }
};

export default App;