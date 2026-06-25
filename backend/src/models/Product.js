const pool = require('../config/db');

const Product = {
  findAll: async () => {
    const query = `
      SELECT p.*, COALESCE(array_agg(pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}') AS category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      GROUP BY p.id
      ORDER BY p.id DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  findById: async (id) => {
    const query = `
      SELECT p.*, COALESCE(array_agg(pc.category_id) FILTER (WHERE pc.category_id IS NOT NULL), '{}') AS category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  create: async (productData) => {
    const { 
      title, price, tax_rate, stock_quantity, 
      category_ids, 
      cover_image, author, description, rating 
    } = productData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertProductQuery = `
        INSERT INTO products (title, price, tax_rate, stock_quantity, cover_image, author, description, rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const productResult = await client.query(insertProductQuery, [
        title, 
        price, 
        tax_rate || 5.00, 
        stock_quantity || 0, 
        cover_image || null,
        author || 'Chưa rõ', 
        description || '', 
        rating || 5.00 
      ]);

      const newProduct = productResult.rows[0];
      const productId = newProduct.id;

      if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
        const valueStrings = category_ids.map((_, index) => `($1, $${index + 2})`).join(', ');
        const insertIntersectionQuery = `
          INSERT INTO product_categories (product_id, category_id)
          VALUES ${valueStrings}
        `;
        
        const queryParams = [productId, ...category_ids];
        await client.query(insertIntersectionQuery, queryParams);
      }

      await client.query('COMMIT');
      
      newProduct.category_ids = category_ids || [];
      return newProduct;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getRelated: async (productId) => {
    const query = `
      WITH current_cats AS (
        -- Bước 1: Lấy toàn bộ các category_id và thông tin cha-con của sách gốc
        SELECT pc.category_id, c.parent_id
        FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.product_id = $1
      ),
      related_pool AS (
        -- Bước 2: Tìm tất cả các sách khác có chung ít nhất 1 danh mục với sách gốc
        SELECT DISTINCT p.*, 
               cc.parent_id AS shared_cat_parent_id
        FROM products p
        JOIN product_categories pc ON p.id = pc.product_id
        JOIN current_cats cc ON pc.category_id = cc.category_id
        WHERE p.id != $1
      )
      -- Bước 3: Xuất dữ liệu và ưu tiên sắp xếp những dòng chung danh mục con (parent_id IS NOT NULL) lên đầu
      SELECT id, title, author, price, cover_image, rating, stock_quantity, tax_rate 
      FROM related_pool
      ORDER BY (CASE WHEN shared_cat_parent_id IS NOT NULL THEN 1 ELSE 2 END) ASC, id DESC
      LIMIT 5;
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  }
};

module.exports = Product;