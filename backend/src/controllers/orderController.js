const pool = require('../config/db');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

const checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, items, shippingAddress, paymentMethod, needInvoice, billingInfo } = req.body;
    await client.query('BEGIN');

    // 1. Tính toán
    let subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal + taxAmount + 20000;

    // 2. Gọi Model lưu Order & Details
    const orderId = await Order.create(client, { userId, totalAmount, taxAmount, shippingAddress, paymentMethod });
    await Order.createDetails(client, orderId, items);

    // 3. Nếu khách cần hóa đơn, gọi Model Invoice
    if (needInvoice) {
      await Invoice.create(client, {
        orderId,
        invoiceCode: `INV-${Date.now()}`,
        taxId: billingInfo.taxId,
        billingName: billingInfo.billingName,
        totalVat: taxAmount,
        totalFinal: totalAmount
      });
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, orderId, message: "Order success!" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { checkout };