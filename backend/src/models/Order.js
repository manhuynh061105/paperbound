const pool = require('../config/db');

const Order = {
  create: async (client, orderData) => {
    const { userId, totalAmount, taxAmount, shippingAddress, paymentMethod } = orderData;
    const result = await client.query(
      'INSERT INTO orders (user_id, total_amount, tax_amount, shipping_address, payment_method) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, totalAmount, taxAmount, shippingAddress, paymentMethod]
    );
    return result.rows[0].id;
  },
  
  createDetails: async (client, orderId, items) => {
    for (const item of items) {
      const productId = item.product_id || item.productId; 
      const price = item.price || item.priceAtPurchase;

      await client.query(
        'INSERT INTO order_details (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [orderId, productId, item.quantity, price]
      );
    }
  },

  // 💡 BỔ SUNG: Hàm dọn sạch giỏ hàng nằm trong luồng Transaction luôn
  clearCart: async (client, userId) => {
    await client.query('DELETE FROM carts WHERE user_id = $1', [userId]);
  },

  // 🌟 🌟 🌟 BỔ SUNG MỚI: Hàm lấy lịch sử đơn hàng kèm thông tin Hóa đơn & Sản phẩm chi tiết
  getByUserId: async (userId) => {
    const query = `
      SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.tax_amount,
        o.shipping_address,
        o.payment_method,
        o.status,
        o.created_at,
        -- Kiểm tra sự tồn tại của hóa đơn để bật nút ở FE
        CASE WHEN i.id IS NOT NULL THEN true ELSE false END AS has_invoice,
        i.invoice_code,
        i.tax_id,
        i.billing_name,
        i.total_vat,
        i.total_final,
        -- Gom nhóm toàn bộ danh sách sản phẩm thuộc đơn hàng này thành mảng JSON
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'title', p.title,
              'cover_image', p.cover_image,
              'quantity', od.quantity,
              'price', od.price_at_purchase
            )
          ) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS products
      FROM orders o
      LEFT JOIN invoices i ON o.id = i.order_id
      LEFT JOIN order_details od ON o.id = od.order_id
      LEFT JOIN products p ON od.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id, i.id
      ORDER BY o.created_at DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
};

module.exports = Order;