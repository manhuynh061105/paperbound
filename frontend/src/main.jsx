import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext' // 💡 ĐÃ BỔ SUNG: Import Provider quản lý giỏ hàng toàn cục

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider> {/* 💡 ĐÃ BỔ SUNG: Bọc CartProvider ở đây */}
      <App />
    </CartProvider>
  </StrictMode>,
)