const Cart = require('../models/Cart');

const getCart = async (req, res) => {
  try {
    const { userId } = req.params; // Sau này sẽ lấy từ Token
    const items = await Cart.findByUserId(userId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const newItem = await Cart.addToCart(userId, productId, quantity || 1);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
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

// Nhớ export thêm updateQuantity ở cuối file nhé!
module.exports = { getCart, addItem, deleteItem, updateQuantity };