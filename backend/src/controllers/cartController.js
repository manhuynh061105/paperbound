const Cart = require('../models/Cart');

const getCart = async (req, res) => {
  try {
    const { userId } = req.params; 
    const items = await Cart.findByUserId(userId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const cleanUserId = typeof userId === 'object' && userId !== null ? userId.id : Number(userId);
    const cleanProductId = typeof productId === 'object' && productId !== null ? productId.id : Number(productId);
    const cleanQuantity = Number(quantity) || 1;

    if (!cleanUserId || !cleanProductId) {
      return res.status(400).json({ 
        success: false, 
        message: "Dữ liệu userId hoặc productId gửi lên không hợp lệ (bị ép kiểu lỗi)!" 
      });
    }

    const newItem = await Cart.addToCart(cleanUserId, cleanProductId, cleanQuantity);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error("🔥 Lỗi tại addItem Controller:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await Cart.removeItem(userId, productId);
    res.status(200).json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Số lượng không thể nhỏ hơn 1" });
    }
    const updated = await Cart.updateQuantity(userId, productId, quantity);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, addItem, deleteItem, updateQuantity };