import { query } from '../config/db.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import { generateUpiLink, getUpiAppLinks } from '../services/paymentService.js';
import { generateOtp, getOtpExpiry, validateOtp } from '../services/otpService.js';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendOtpEmail } from '../services/emailService.js';

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, storeId, specialInstructions } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    const storeResult = await query(
      'SELECT id, name, upi_id, is_active FROM stores WHERE id = $1',
      [storeId]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      });
    }

    const store = storeResult.rows[0];

    if (!store.is_active) {
      return res.status(400).json({
        success: false,
        message: 'This store is currently not accepting orders.',
      });
    }

    const itemIds = items.map((item) => item.menuItemId);
    const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(', ');
    const menuResult = await query(
      `SELECT id, name, price, store_id, is_available FROM menu_items WHERE id IN (${placeholders})`,
      itemIds
    );

    if (menuResult.rows.length !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more items not found.',
      });
    }

    const menuItemMap = {};
    for (const row of menuResult.rows) {
      if (row.store_id !== storeId) {
        return res.status(400).json({
          success: false,
          message: `Item "${row.name}" does not belong to this store.`,
        });
      }
      if (!row.is_available) {
        return res.status(400).json({
          success: false,
          message: `Item "${row.name}" is currently unavailable.`,
        });
      }
      menuItemMap[row.id] = row;
    }

    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItemMap[item.menuItemId];
      const quantity = parseInt(item.quantity, 10) || 1;
      const itemTotal = parseFloat(menuItem.price) * quantity;
      totalAmount += itemTotal;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: parseFloat(menuItem.price),
        quantity,
        total: itemTotal,
      };
    });

    totalAmount = Math.round(totalAmount * 100) / 100;

    const orderNumber = generateOrderNumber();

    const orderResult = await query(
      `INSERT INTO orders (order_number, user_id, store_id, items, total_amount, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orderNumber, userId, storeId, JSON.stringify(orderItems), totalAmount, specialInstructions || null]
    );

    const order = orderResult.rows[0];

    const upiLink = generateUpiLink(store.upi_id, store.name, totalAmount, orderNumber);
    const upiAppLinks = getUpiAppLinks(upiLink);

    try {
      await sendOrderConfirmation(req.user.email, req.user.name, {
        ...order,
        items: orderItems,
        store_name: store.name,
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: {
        order,
        payment: {
          upiLink,
          upiAppLinks,
          amount: totalAmount,
          storeName: store.name,
          storeUpiId: store.upi_id,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let sql;
    let countSql;
    const params = [];
    let paramIndex = 1;

    if (role === 'store_employee') {
      const storeResult = await query('SELECT id FROM stores WHERE owner_id = $1', [userId]);
      if (storeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'You do not own a store.',
        });
      }
      const storeId = storeResult.rows[0].id;

      sql = `SELECT o.*, u.name AS customer_name, u.email AS customer_email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.store_id = $${paramIndex}`;
      countSql = `SELECT COUNT(*) FROM orders WHERE store_id = $${paramIndex}`;
      params.push(storeId);
      paramIndex++;
    } else {
      sql = `SELECT o.*, s.name AS store_name
             FROM orders o
             JOIN stores s ON o.store_id = s.id
             WHERE o.user_id = $${paramIndex}`;
      countSql = `SELECT COUNT(*) FROM orders WHERE user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      sql += ` AND o.order_status = $${paramIndex}`;
      countSql += ` AND order_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        orders: result.rows,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const result = await query(
      `SELECT o.*, s.name AS store_name, s.upi_id AS store_upi_id, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const order = result.rows[0];

    if (role === 'store_employee') {
      const storeResult = await query('SELECT id FROM stores WHERE owner_id = $1', [userId]);
      if (storeResult.rows.length === 0 || storeResult.rows[0].id !== order.store_id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order.',
        });
      }
    } else if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentStatus, transactionId } = req.body;

    if (!paymentStatus || !['pending', 'success', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment status is required (pending, success, failed).',
      });
    }

    const orderResult = await query(
      `SELECT o.*, s.owner_id
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const order = orderResult.rows[0];

    if (order.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order.',
      });
    }

    let orderStatus = order.order_status;
    if (paymentStatus === 'success' && order.order_status === 'placed') {
      orderStatus = 'accepted';
    }

    const result = await query(
      `UPDATE orders
       SET payment_status = $1, transaction_id = $2, order_status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [paymentStatus, transactionId || order.transaction_id, orderStatus, id]
    );

    if (paymentStatus === 'success') {
      try {
        const customerResult = await query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);
        if (customerResult.rows.length > 0) {
          const customer = customerResult.rows[0];
          await sendOrderStatusUpdate(customer.email, customer.name, result.rows[0], 'accepted');
        }
      } catch (emailError) {
        console.error('Failed to send order status update email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully.',
      data: { order: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    const validTransitions = {
      accepted: ['processing'],
      processing: ['ready'],
      ready: ['picked_up'],
    };

    const orderResult = await query(
      `SELECT o.*, s.owner_id
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const order = orderResult.rows[0];

    if (order.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order.',
      });
    }

    const allowedNextStatuses = validTransitions[order.order_status];
    if (!allowedNextStatuses || !allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${order.order_status}" to "${status}".`,
      });
    }

    if (status === 'picked_up' && !order.is_otp_verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be verified before marking as picked up.',
      });
    }

    let otp = null;
    let otpExpiresAt = null;

    if (status === 'ready') {
      otp = generateOtp();
      otpExpiresAt = getOtpExpiry();
    }

    const updateFields = ['order_status = $1', 'updated_at = NOW()'];
    const updateParams = [status];
    let paramIndex = 2;

    if (otp) {
      updateFields.push(`otp = $${paramIndex}`);
      updateParams.push(otp);
      paramIndex++;
      updateFields.push(`otp_expires_at = $${paramIndex}`);
      updateParams.push(otpExpiresAt);
      paramIndex++;
    }

    updateParams.push(id);
    const result = await query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateParams
    );

    const customerResult = await query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);

    if (customerResult.rows.length > 0) {
      const customer = customerResult.rows[0];
      try {
        await sendOrderStatusUpdate(customer.email, customer.name, result.rows[0], status);

        if (status === 'ready' && otp) {
          await sendOtpEmail(customer.email, customer.name, otp, order.order_number);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    const responseData = { order: result.rows[0] };
    if (status === 'ready' && otp) {
      responseData.otp = otp;
    }

    res.json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOrderOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required.',
      });
    }

    const orderResult = await query(
      `SELECT o.*, s.owner_id
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const order = orderResult.rows[0];

    if (order.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to verify OTP for this order.',
      });
    }

    if (order.order_status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'OTP can only be verified when order status is "ready".',
      });
    }

    const isValid = validateOtp(order.otp, otp, order.otp_expires_at);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    const result = await query(
      `UPDATE orders SET is_otp_verified = true, order_status = 'picked_up', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    try {
      const customerResult = await query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);
      if (customerResult.rows.length > 0) {
        const customer = customerResult.rows[0];
        await sendOrderStatusUpdate(customer.email, customer.name, result.rows[0], 'picked_up');
      }
    } catch (emailError) {
      console.error('Failed to send pickup confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'OTP verified. Order marked as picked up.',
      data: { order: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const pollOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, order_number, payment_status, order_status, updated_at FROM orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
