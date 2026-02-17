import { query } from '../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, name, email, role, register_number, employee_id, phone_number, is_email_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const user = result.rows[0];

    let store = null;
    if (user.role === 'store_employee') {
      const storeResult = await query('SELECT * FROM stores WHERE owner_id = $1', [userId]);
      if (storeResult.rows.length > 0) {
        store = storeResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: { user, store },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phoneNumber } = req.body;

    const currentUser = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const user = currentUser.rows[0];

    const result = await query(
      `UPDATE users
       SET name = $1, phone_number = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, register_number, employee_id, phone_number, is_email_verified, created_at, updated_at`,
      [name || user.name, phoneNumber !== undefined ? phoneNumber : user.phone_number, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};
