import { query } from '../config/db.js';

export const addMenuItem = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const storeResult = await query('SELECT id FROM stores WHERE owner_id = $1', [userId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'You do not own a store.',
      });
    }

    const storeId = storeResult.rows[0].id;
    const { name, description, price, category } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `INSERT INTO menu_items (store_id, name, description, price, image_url, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [storeId, name, description || null, price, imageUrl, category || null]
    );

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully.',
      data: { menuItem: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const itemResult = await query(
      `SELECT mi.*, s.owner_id
       FROM menu_items mi
       JOIN stores s ON mi.store_id = s.id
       WHERE mi.id = $1`,
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    if (itemResult.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this menu item.',
      });
    }

    const item = itemResult.rows[0];
    const { name, description, price, category, is_available } = req.body;

    let imageUrl = item.image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `UPDATE menu_items
       SET name = $1, description = $2, price = $3, image_url = $4, category = $5, is_available = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        name || item.name,
        description !== undefined ? description : item.description,
        price || item.price,
        imageUrl,
        category !== undefined ? category : item.category,
        is_available !== undefined ? is_available : item.is_available,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Menu item updated successfully.',
      data: { menuItem: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const itemResult = await query(
      `SELECT mi.id, s.owner_id
       FROM menu_items mi
       JOIN stores s ON mi.store_id = s.id
       WHERE mi.id = $1`,
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    if (itemResult.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this menu item.',
      });
    }

    await query('DELETE FROM menu_items WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Menu item deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const itemResult = await query(
      `SELECT mi.id, mi.is_available, s.owner_id
       FROM menu_items mi
       JOIN stores s ON mi.store_id = s.id
       WHERE mi.id = $1`,
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    if (itemResult.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this menu item.',
      });
    }

    const newAvailability = !itemResult.rows[0].is_available;

    const result = await query(
      'UPDATE menu_items SET is_available = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newAvailability, id]
    );

    res.json({
      success: true,
      message: `Menu item is now ${newAvailability ? 'available' : 'unavailable'}.`,
      data: { menuItem: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};
