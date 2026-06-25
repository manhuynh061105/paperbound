const pool = require('../config/db');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

const checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, items, shippingAddress, paymentMethod, needInvoice, billingInfo, totalAmountFromFE, taxAmountFromFE } = req.body;
    
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu giỏ hàng hoặc User trống, không thể checkout!" });
    }

    await client.query('BEGIN');

    let subtotal = items.reduce((acc, item) => {
      const price = Number(item.price || item.priceAtPurchase || 0);
      const qty = Number(item.quantity || 0);
      return acc + (price * qty);
    }, 0);

    const taxAmount = taxAmountFromFE !== undefined ? Number(taxAmountFromFE) : (subtotal * 0.05);
    const totalAmount = totalAmountFromFE !== undefined ? Number(totalAmountFromFE) : (subtotal + taxAmount + 30000);

    const orderId = await Order.create(client, {
      userId: Number(userId),
      totalAmount,
      taxAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD'
    }); 

    await Order.createDetails(client, orderId, items);

    if (needInvoice && billingInfo) {
      const extra = billingInfo.extraMetadata || {};
      
      let customBillingName = billingInfo.billingName;
      
      if (extra.invoiceType === 'company') {
        customBillingName = `[DN] ${extra.companyName} - ĐC: ${extra.companyAddress} - Người mua: ${extra.buyerName || 'Trống'} - QHNS: ${extra.qhnsCode || 'Không'}`;
      } else {
        customBillingName = `[CN] ${extra.buyerName || 'Khách lẻ'} - ĐC: ${extra.personalAddress || 'Trống'}`;
      }
      
      customBillingName += ` - Email nhận: ${extra.invoiceEmail || ''}`;

      const actualOrderId = typeof orderId !== 'undefined' ? orderId 
                          : typeof newOrder !== 'undefined' ? newOrder.id 
                          : typeof order !== 'undefined' ? order.id 
                          : null;

      await Invoice.create(client, {
        orderId: actualOrderId,
        invoiceCode: `INV-${Date.now()}`,
        taxId: billingInfo.taxId || 'KHONG_CO', 
        billingName: customBillingName, 
        totalVat: taxAmountFromFE,
        totalFinal: totalAmountFromFE
      });
    }
    await Order.clearCart(client, Number(userId));

    await client.query('COMMIT');
    
    return res.status(201).json({ 
      success: true, 
      orderId, 
      message: "🎉 Đặt hàng thành công và hóa đơn đã được xử lý thành công!" 
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    
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
    const ordersQuery = `
      SELECT 
        o.id, 
        o.user_id, 
        o.status, 
        o.payment_method, 
        o.total_amount, 
        o.tax_amount, 
        o.shipping_address, 
        o.created_at,
        -- Kích hoạt nút Xem hóa đơn ở FE dựa trên sự tồn tại của ID hóa đơn
        CASE WHEN i.id IS NOT NULL THEN true ELSE false END as has_invoice,
        i.invoice_code,
        i.tax_id,
        i.billing_name,
        i.total_vat,
        i.total_final
      FROM orders o
      LEFT JOIN invoices i ON o.id = i.order_id
      WHERE o.user_id = $1
      ORDER BY o.id DESC
    `;
    const ordersResult = await pool.query(ordersQuery, [userId]);
    const orders = ordersResult.rows || ordersResult;

    if (!orders || orders.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const data = [];
    
    for (let order of orders) {
      let products = [];
      try {
        const itemsQuery = `
          SELECT p.id, p.title, p.cover_image, od.price_at_purchase as price, od.quantity,
                 EXISTS (
                   SELECT 1 FROM reviews r 
                   WHERE r.product_id = p.id 
                     AND r.user_id = $1 
                     AND r.created_at >= $2 
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
        
        has_invoice: order.has_invoice,
        invoice_code: order.invoice_code,
        tax_id: order.tax_id,
        billing_name: order.billing_name,
        total_vat: order.total_vat,
        total_final: order.total_final,
        
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