const getOrdersByUserId = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 1. LẤY DANH SÁCH ĐƠN HÀNG GỐC CỦA USER kèm THÔNG TIN HÓA ĐƠN ĐỎ (NẾU CÓ)
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
        -- Kiểm tra xem đơn hàng đã xuất hóa đơn chưa để gửi trạng thái về FE kích hoạt nút
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

    // 2. LẤY CHI TIẾT SẢN PHẨM CỦA TỪNG ĐƠN HÀNG
    const data = [];
    
    for (let order of orders) {
      let products = [];
      try {
        // Giữ nguyên logic check review dựa trên mốc thời gian của bạn
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

      // Đẩy gói dữ liệu đầy đủ (gồm cả dữ liệu đơn hàng, hóa đơn và mảng sản phẩm) vào mảng chung
      data.push({
        id: order.id,
        user_id: order.user_id,
        status: order.status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        tax_amount: order.tax_amount,
        shipping_address: order.shipping_address,
        created_at: order.created_at,
        
        // 🌟 CÁC TRƯỜNG DỮ LIỆU ĐƯỢC BỔ SUNG ĐỂ ĐỔ VÀO MODAL FRONTEND
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