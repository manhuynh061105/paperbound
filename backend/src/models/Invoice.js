const pool = require('../config/db');

const Invoice = {
  create: async (client, invoiceData) => {
    // Không dùng biến 'metadata' riêng nữa
    const { orderId, invoiceCode, taxId, billingName, totalVat, totalFinal } = invoiceData;
    
    // Đưa câu lệnh về đúng 6 cột nguyên thủy trong cơ sở dữ liệu cũ của bạn
    const result = await client.query(
      'INSERT INTO invoices (order_id, invoice_code, tax_id, billing_name, total_vat, total_final) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orderId, invoiceCode, taxId, billingName, totalVat, totalFinal]
    );
    return result.rows[0];
  }
};

module.exports = Invoice;