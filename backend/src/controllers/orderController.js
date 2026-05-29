const pool = require('../config/db');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

const checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, items, shippingAddress, paymentMethod, needInvoice, billingInfo, totalAmountFromFE, taxAmountFromFE } = req.body;
    
    // Kiểm tra dữ liệu đầu vào tối thiểu để tránh lỗi crash nửa chừng
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu giỏ hàng hoặc User trống, không thể checkout!" });
    }

    await client.query('BEGIN');

    // 💡 ĐÃ ĐỒNG BỘ: Ép kiểu dữ liệu an toàn để Postgres không từ chối lưu dữ liệu NUMERIC
    let subtotal = items.reduce((acc, item) => {
      const price = Number(item.price || item.priceAtPurchase || 0);
      const qty = Number(item.quantity || 0);
      return acc + (price * qty);
    }, 0);

    const taxAmount = taxAmountFromFE !== undefined ? Number(taxAmountFromFE) : (subtotal * 0.05);
    const totalAmount = totalAmountFromFE !== undefined ? Number(totalAmountFromFE) : (subtotal + taxAmount + 30000);

    // 1. Gọi Model lưu Order & Details
    const orderId = await Order.create(client, { 
      userId: Number(userId), 
      totalAmount, 
      taxAmount, 
      shippingAddress, 
      paymentMethod 
    });
    
    await Order.createDetails(client, orderId, items);

    // 2. Nếu khách cần hóa đơn, gọi Model Invoice
    if (needInvoice && billingInfo) {
      await Invoice.create(client, {
        orderId,
        invoiceCode: `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        taxId: billingInfo.taxId,
        billingName: billingInfo.billingName,
        totalVat: taxAmount,
        totalFinal: totalAmount
      });
    }

    // 3. Đặt hàng xong thì dọn sạch giỏ hàng của User ngay
    await Order.clearCart(client, Number(userId));

    await client.query('COMMIT');
    
    // Trả về kết quả thành công thực sự cho Front-End nhận biết
    return res.status(201).json({ success: true, orderId, message: "🎉 Đặt hàng thành công và hóa đơn đã được xử lý!" });
    
  } catch (err) {
    await client.query('ROLLBACK');
    
    // 💥 DÒNG THẦN THÁNH: Giúp hai bạn nhìn thấy nguyên nhân sập Transaction ngay trong Terminal Node.js
    console.error("❌ LỖI TRANSACTON CHECKOUT TẠI BACKEND:", err);
    
    return res.status(500).json({ success: false, error: err.message, message: "Lỗi hệ thống khi xử lý đơn hàng!" });
  } finally {
    client.release();
  }
};

module.exports = { checkout };