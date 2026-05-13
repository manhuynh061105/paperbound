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

module.exports = { getCart, addItem, deleteItem };