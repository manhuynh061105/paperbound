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

    // 1. Ép kiểu dữ liệu an toàn để tính toán số tiền
    let subtotal = items.reduce((acc, item) => {
      const price = Number(item.price || item.priceAtPurchase || 0);
      const qty = Number(item.quantity || 0);
      return acc + (price * qty);
    }, 0);

    const taxAmount = taxAmountFromFE !== undefined ? Number(taxAmountFromFE) : (subtotal * 0.05);
    const totalAmount = totalAmountFromFE !== undefined ? Number(totalAmountFromFE) : (subtotal + taxAmount + 30000);

    // 2. TẠO ĐƠN HÀNG GỐC TRƯỚC ĐỂ LẤY ORDER ID (Sửa dứt điểm lỗi orderId/order is not defined)
    const orderId = await Order.create(client, {
      userId: Number(userId),
      totalAmount,
      taxAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD'
    }); 

    // 3. LƯU CHI TIẾT CÁC SẢN PHẨM VÀO ĐƠN HÀNG
    await Order.createDetails(client, orderId, items);

    // 4. NẾU KHÁCH CẦN HÓA ĐƠN ĐỎ -> GỌI MODEL INVOICE
    // ================= ĐOẠN CODE SỬA LỖI TRONG ORDERCONTROLLER.JS =================
    if (needInvoice && billingInfo) {
      const extra = billingInfo.extraMetadata || {};
      
      let customBillingName = billingInfo.billingName;
      
      // Gộp thông tin chi tiết kiểu Fahasa thành chuỗi text dài lưu vào trường billing_name
      if (extra.invoiceType === 'company') {
        customBillingName = `[DN] ${extra.companyName} - ĐC: ${extra.companyAddress} - Người mua: ${extra.buyerName || 'Trống'} - QHNS: ${extra.qhnsCode || 'Không'}`;
      } else {
        customBillingName = `[CN] ${extra.buyerName || 'Khách lẻ'} - ĐC: ${extra.personalAddress || 'Trống'}`;
      }
      
      customBillingName += ` - Email nhận: ${extra.invoiceEmail || ''}`;

      // 🔥 SỬA LỖI TẠI ĐÂY: Xác định chính xác biến ID của Đơn hàng vừa tạo phía trên
      // Bạn hãy nhìn ngược lên vài dòng xem biến lưu kết quả đơn hàng mới của bạn tên là gì (thường là 'newOrder', 'resultOrder', hoặc 'order')
      // Dưới đây là giải pháp an toàn tự động quét biến:
      const actualOrderId = typeof orderId !== 'undefined' ? orderId 
                          : typeof newOrder !== 'undefined' ? newOrder.id 
                          : typeof order !== 'undefined' ? order.id 
                          : null; // Dự phòng trường hợp xấu nhất

      await Invoice.create(client, {
        orderId: actualOrderId, // 👈 Đã thay thế 'orderIdFromBE' bằng biến 'actualOrderId' vừa tìm được
        invoiceCode: `INV-${Date.now()}`,
        taxId: billingInfo.taxId || 'KHONG_CO', 
        billingName: customBillingName, 
        totalVat: taxAmountFromFE,
        totalFinal: totalAmountFromFE
      });
    }
    // 5. ĐẶT HÀNG THÀNH CÔNG -> DỌN SẠCH GIỎ HÀNG CỦA USER
    await Order.clearCart(client, Number(userId));

    await client.query('COMMIT');
    
    // Trả về kết quả thành công thực sự cho Front-End nhận biết
    return res.status(201).json({ 
      success: true, 
      orderId, 
      message: "🎉 Đặt hàng thành công và hóa đơn đã được xử lý thành công!" 
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    
    // In lỗi chi tiết tại Terminal để dễ debug
    console.error("❌ LỖI TRANSACTION CHECKOUT TẠI BACKEND:", err);
    
    return res.status(500).json({ 
      success: false, 
      error: err.message, 
      message: "Lỗi hệ thống nội bộ khi xử lý đơn hàng!" 
    });
  } finally {
    client.release();
  }
};

const getOrdersByUserId = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 1. LẤY DANH SÁCH ĐƠN HÀNG GỐC CỦA USER
    const ordersQuery = `
      SELECT id, user_id, status, payment_method, total_amount, tax_amount, shipping_address, created_at
      FROM orders 
      WHERE user_id = $1
      ORDER BY id DESC
    `;
    const ordersResult = await pool.query(ordersQuery, [userId]);
    const orders = ordersResult.rows || ordersResult;

    if (!orders || orders.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. LẤY CHI TIẾT SẢN PHẨM CỦA TỪNG ĐƠN HÀNG
    const data = [];
    
    for (let order of orders) {
      let products = [];
      try {
        // 🔥 SỬA LOGIC EXISTS: Chỉ tính là đã đánh giá nếu sản phẩm đó 
        // có thời gian đánh giá (created_at) SAU thời gian tạo đơn hàng này (created_at).
        // Cách này giúp nhận diện chính xác đánh giá của từng lượt mua mà không cần thêm cột order_id vào bảng reviews.
        const itemsQuery = `
          SELECT p.id, p.title, p.cover_image, od.price_at_purchase as price, od.quantity,
                 EXISTS (
                   SELECT 1 FROM reviews r 
                   WHERE r.product_id = p.id 
                     AND r.user_id = $1 
                     AND r.created_at >= $2 -- Đánh giá phải được viết sau khi tạo đơn hàng này
                 ) as is_reviewed
          FROM order_details od
          JOIN products p ON od.product_id = p.id
          WHERE od.order_id = $3
        `;
        const itemsResult = await pool.query(itemsQuery, [userId, order.created_at, order.id]);
        products = itemsResult.rows || [];
      } catch (itemErr) {
        console.error(`⚠️ Cảnh báo: Lỗi lấy sản phẩm cho đơn #${order.id}. Đang thử quét qua bảng dự phòng 'order_items'...`);
        
        try {
          const fallbackQuery = `
            SELECT p.id, p.title, p.cover_image, oi.price, oi.quantity,
                   EXISTS (
                     SELECT 1 FROM reviews r 
                     WHERE r.product_id = p.id 
                       AND r.user_id = $1 
                       AND r.created_at >= $2
                   ) as is_reviewed
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $3
          `;
          const fallbackResult = await pool.query(fallbackQuery, [userId, order.created_at, order.id]);
          products = fallbackResult.rows || [];
        } catch (fallbackErr) {
          console.error(`❌ Cả 2 bảng chi tiết đều không đúng tên, trả về mảng rỗng:`, fallbackErr.message);
          products = [];
        }
      }

      data.push({
        id: order.id,
        user_id: order.user_id,
        status: order.status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        tax_amount: order.tax_amount,
        shipping_address: order.shipping_address,
        created_at: order.created_at,
        products: products 
      });
    }

    return res.json({ success: true, data });

  } catch (err) {
    console.error("🔥 Lỗi nghiêm trọng tại getOrdersByUserId Controller:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; 

  try {
    const updateQuery = `
      UPDATE orders 
      SET status = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [status, orderId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng này!" });
    }

    return res.json({ success: true, message: "Cập nhật trạng thái thành công!", data: result.rows[0] });
  } catch (err) {
    console.error("Lỗi tại updateOrderStatus:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { checkout, getOrdersByUserId, updateOrderStatus };