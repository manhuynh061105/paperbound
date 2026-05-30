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
      // 💡 ĐÃ SỬA CHUẨN: Sử dụng item.product_id và item.price (hoặc giá trị bóc tách chính xác từ FE)
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
  }
};

module.exports = Order;