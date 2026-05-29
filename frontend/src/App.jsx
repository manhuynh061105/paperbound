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

// Import Services
import { cartService, productService } from './services/api';

function App() {
  // 1. Quản lý trạng thái đăng nhập từ localStorage (Mặc định null nếu chưa có)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [cartCount, setCartCount] = useState(0); 
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // State bổ sung để ép kích hoạt reload lại danh sách sách ở HomePage sau khi thêm mới
  const [productTrigger, setProductTrigger] = useState(0);

  // Lấy ra ID và Quyền (Role) hiện tại dựa trên Session User
  const userId = currentUser ? currentUser.id : null;
  const userRole = currentUser ? currentUser.role : 'customer';

  // 2. Hàm tính tổng số lượng sản phẩm trong giỏ từ Database
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

  // Tự động chạy đồng bộ giỏ hàng khi khởi chạy ứng dụng hoặc khi User thay đổi
  useEffect(() => {
    refreshCartCount();
  }, [userId]);

  // Hàm xử lý đăng nhập thành công
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCartCount(0);
    toast.info("ℹ️ Đã đăng xuất khỏi hệ thống.");
  };

  // =========================================================
  // FIX LỖI: HÀM GỌI API THẬT ĐỂ LƯU SÁCH MỚI VÀO POSTGRES
  // =========================================================
  const handleAddNewProduct = async (newProduct) => {
    try {
      // Gọi service để POST dữ liệu JSON và Base64 ảnh bìa lên Backend
      const response = await productService.create(newProduct);
      
      if (response.data.success) {
        toast.success(`🎉 Thêm thành công cuốn sách: "${newProduct.title}" vào Database!`);
        
        // Tăng trigger lên 1 đơn vị để báo hiệu cho HomePage tự động nạp lại danh sách mới
        setProductTrigger(prev => prev + 1);
        
        // Đóng modal thêm sách
        setIsAdminModalOpen(false);
      }
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm qua API:", error);
      const errorMsg = error.response?.data?.message || error.message || "Không thể kết nối tới máy chủ!";
      toast.error(`❌ Thêm thất bại: ${errorMsg}`);
    }
  };

  return (
    <Router>
      <div style={styles.appWrapper}>
        {/* Header nhận userRole động dựa trên tài khoản đăng nhập */}
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
            {/* Truyền thêm productTrigger vào HomePage để nó tự F5 ngầm danh sách sách */}
            <Route path="/" element={<HomePage refreshCartCount={refreshCartCount} productTrigger={productTrigger} />} />
            <Route path="/cart" element={<CartPage refreshCartCount={refreshCartCount} />} />
            <Route path="/checkout" element={<CheckoutPage refreshCartCount={refreshCartCount} />} />
            <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/profile" element={<ProfilePage />} />
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

        {/* Cấu hình ToastContainer toàn cục để nhận lệnh bắn thông báo nhanh */}
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