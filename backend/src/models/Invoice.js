const pool = require('../config/db');

const Invoice = {
  create: async (client, invoiceData) => {
    // metadata dùng để lưu chuỗi JSON gom tất cả các trường không bắt buộc (Email, Địa chỉ, QHNS...)
    const { orderId, invoiceCode, taxId, billingName, totalVat, totalFinal, metadata } = invoiceData;
    
    // Bạn có thể chạy lệnh SQL này trong pgAdmin trước để thêm cột nếu chưa có: 
    // ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_metadata TEXT;

    const result = await client.query(
      `INSERT INTO invoices (order_id, invoice_code, tax_id, billing_name, total_vat, total_final, invoice_metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orderId, invoiceCode, taxId, billingName, totalVat, totalFinal, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }
};

module.exports = Invoice;