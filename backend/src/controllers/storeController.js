import { query } from '../config/db.js';

export const getAllStores = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, u.name AS owner_name
       FROM stores s
       JOIN users u ON s.owner_id = u.id
       WHERE s.is_active = true
       ORDER BY s.created_at DESC`
    );

    res.json({
      success: true,
      data: { stores: result.rows },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT s.*, u.name AS owner_name, u.email AS owner_email, u.phone_number AS owner_phone
       FROM stores s
       JOIN users u ON s.owner_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      });
    }

    res.json({
      success: true,
      data: { store: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const storeResult = await query('SELECT * FROM stores WHERE id = $1', [id]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      });
    }

    if (storeResult.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this store.',
      });
    }

    const { name, description, upi_id, is_active, operating_hours, image_url } = req.body;
    const store = storeResult.rows[0];

    const result = await query(
      `UPDATE stores
       SET name = $1, description = $2, upi_id = $3, is_active = $4, operating_hours = $5, image_url = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        name || store.name,
        description !== undefined ? description : store.description,
        upi_id || store.upi_id,
        is_active !== undefined ? is_active : store.is_active,
        operating_hours ? JSON.stringify(operating_hours) : store.operating_hours,
        image_url !== undefined ? image_url : store.image_url,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Store updated successfully.',
      data: { store: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, search } = req.query;

    const storeResult = await query('SELECT id FROM stores WHERE id = $1', [id]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      });
    }

    let sql = 'SELECT * FROM menu_items WHERE store_id = $1';
    const params = [id];
    let paramIndex = 2;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      sql += ` AND LOWER(name) LIKE $${paramIndex}`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    sql += ' ORDER BY category, name';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: { menuItems: result.rows },
    });
  } catch (error) {
    next(error);
  }
};
