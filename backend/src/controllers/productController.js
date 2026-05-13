const Product = require('../models/Product');

const getAllProducts = async (req, res) => {
  try {
    const data = await Product.findAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const data = await Product.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllProducts, getProductById };