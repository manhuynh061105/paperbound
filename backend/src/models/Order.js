const pool = require('../config/db');

const Order = {
  // Vì Checkout dùng Transaction (BEGIN/COMMIT), chúng ta truyền client vào hàm
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
      await client.query(
        'INSERT INTO order_details (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }
  }
};

module.exports = Order;