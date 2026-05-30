import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Khởi tạo giỏ hàng ban đầu từ localStorage nếu có
    const localData = localStorage.getItem('paperbound_cart');
    return localData ? JSON.parse(localData) : [];
  });

  // Tự động đồng bộ giỏ hàng vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem('paperbound_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // 1. Logic Thêm sản phẩm vào giỏ hàng (Có check tồn kho stock_quantity)
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const currentQtyInCart = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQtyInCart + quantity;

      // Kiểm tra xem số lượng đặt có vượt quá số lượng trong kho không
      if (product.stock_quantity !== undefined && newQuantity > product.stock_quantity) {
        toast.error(`❌ Không thể thêm! Trong kho chỉ còn ${product.stock_quantity} sản phẩm.`);
        return prevItems;
      }

      toast.success(`🛒 Đã thêm "${product.title}" vào giỏ hàng!`);

      if (existingItem) {
        // Nếu đã có trong giỏ, tăng số lượng lên
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      
      // Nếu chưa có, thêm mới object vào mảng giỏ hàng
      return [...prevItems, { ...product, quantity }];
    });
  };

  // 2. Logic Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    toast.info("🗑️ Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  // 3. Logic Cập nhật số lượng trực tiếp tại trang CartPage
  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === productId) {
          if (item.stock_quantity !== undefined && newQty > item.stock_quantity) {
            toast.warning(`⚠️ Chỉ còn tối đa ${item.stock_quantity} sản phẩm trong kho!`);
            return { ...item, quantity: item.stock_quantity };
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // 4. Logic Xóa sạch giỏ hàng (khi đặt hàng thành công)
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook tiện ích để các Component con gọi dùng nhanh
export const useCart = () => useContext(CartContext);