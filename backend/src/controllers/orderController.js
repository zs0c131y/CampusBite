import mongoose from 'mongoose'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Store from '../models/Store.js'
import MenuItem from '../models/MenuItem.js'
import generateOrderNumber from '../utils/generateOrderNumber.js'
import { formatOrder } from '../utils/formatters.js'
import { generateUpiLink, getUpiAppLinks } from '../services/paymentService.js'
import { generateOtp, getOtpExpiry, validateOtp } from '../services/otpService.js'
import {
  sendOrderStatusUpdate,
  sendOtpEmail,
} from '../services/emailService.js'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)
const CHECKOUT_TOKEN_EXPIRY_SECONDS = 15 * 60
const CHECKOUT_TOKEN_SECRET = process.env.CHECKOUT_TOKEN_SECRET || process.env.JWT_SECRET
const TRANSACTION_ID_REGEX = /^[A-Za-z0-9]{8,40}$/
const SWEEP_MIN_INTERVAL_MS = 30 * 1000
const UNPAID_ORDER_TIMEOUT_MINUTES = Number(process.env.UNPAID_ORDER_TIMEOUT_MINUTES || 8)
const READY_NO_SHOW_TIMEOUT_MINUTES = Number(process.env.READY_NO_SHOW_TIMEOUT_MINUTES || 20)
const ORDER_COMMITMENT_TIMEOUT_MINUTES = Number(process.env.ORDER_COMMITMENT_TIMEOUT_MINUTES || 4)
const NO_SHOW_WARNING_THRESHOLD = Number(process.env.NO_SHOW_WARNING_THRESHOLD || 2)
const NO_SHOW_RESTRICTION_THRESHOLD = Number(process.env.NO_SHOW_RESTRICTION_THRESHOLD || 3)
const NO_SHOW_RESTRICTION_DAYS = Number(process.env.NO_SHOW_RESTRICTION_DAYS || 14)

let lastSweepTimestamp = 0

const generatePaymentReference = () =>
  `CBPAY${crypto.randomBytes(5).toString('hex').toUpperCase()}`

const nowPlusMinutes = (minutes) => new Date(Date.now() + Math.max(1, minutes) * 60 * 1000)

const nowMinusMinutes = (minutes) => new Date(Date.now() - Math.max(1, minutes) * 60 * 1000)

const toSafeInt = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const getUserTrustTier = (userDoc) => {
  const restrictionDate = userDoc?.ordering_restricted_until
    ? new Date(userDoc.ordering_restricted_until)
    : null
  if (restrictionDate && restrictionDate > new Date()) return 'restricted'
  const noShowCount = toSafeInt(userDoc?.no_show_count, 0)
  if (noShowCount >= NO_SHOW_WARNING_THRESHOLD) return 'watch'
  return 'good'
}

const applyNoShowPenalty = async (userId) => {
  const user = await User.findById(userId)
  if (!user) return

  user.no_show_count = toSafeInt(user.no_show_count, 0) + 1
  user.last_no_show_at = new Date()

  if (user.no_show_count >= NO_SHOW_RESTRICTION_THRESHOLD) {
    user.ordering_restricted_until = nowPlusMinutes(NO_SHOW_RESTRICTION_DAYS * 24 * 60)
    user.trust_tier = 'restricted'
  } else if (user.no_show_count >= NO_SHOW_WARNING_THRESHOLD) {
    user.trust_tier = 'watch'
  } else {
    user.trust_tier = 'good'
  }

  await user.save()
}

const runOrderTimeoutSweep = async () => {
  const now = Date.now()
  if (now - lastSweepTimestamp < SWEEP_MIN_INTERVAL_MS) return
  lastSweepTimestamp = now

  // Cancel stale unpaid orders quickly so stores do not prepare ghost orders.
  const staleUnpaidOrders = await Order.find({
    order_status: 'placed',
    payment_status: 'pending',
    created_at: { $lte: nowMinusMinutes(UNPAID_ORDER_TIMEOUT_MINUTES) },
  }).select('_id')

  if (staleUnpaidOrders.length > 0) {
    const staleIds = staleUnpaidOrders.map((order) => order._id)
    await Order.updateMany(
      { _id: { $in: staleIds } },
      {
        $set: {
          order_status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: 'payment_timeout',
          payment_status: 'failed',
        },
      }
    )
  }

  // Mark ready-but-not-collected orders as no-show and penalize the customer.
  const staleReadyOrders = await Order.find({
    order_status: 'ready',
    is_otp_verified: false,
    ready_expires_at: { $ne: null, $lte: new Date() },
  }).select('_id user_id no_show_recorded')

  for (const order of staleReadyOrders) {
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          order_status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: 'no_show_timeout',
          no_show_recorded: true,
        },
      }
    )

    if (!order.no_show_recorded) {
      await applyNoShowPenalty(order.user_id)
    }
  }
}

const generateUniquePaymentReference = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generatePaymentReference()
    const existing = await Order.exists({ payment_reference: candidate })
    if (!existing) return candidate
  }
  throw new Error('Unable to generate payment reference. Please retry.')
}

const parseStatuses = (status) => {
  if (!status) return null
  const statuses = status
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return statuses.length > 0 ? statuses : null
}

const buildOrderDraft = async ({ items, storeId, specialInstructions }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error('Order must contain at least one item.')
    error.statusCode = 400
    throw error
  }

  if (!storeId || !isValidObjectId(storeId)) {
    const error = new Error('Valid store ID is required.')
    error.statusCode = 400
    throw error
  }

  const normalizedItems = items.map((item) => ({
    menuItemId: item.menuItemId || item.id,
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
  }))

  if (normalizedItems.some((item) => !isValidObjectId(item.menuItemId))) {
    const error = new Error('One or more menu item IDs are invalid.')
    error.statusCode = 400
    throw error
  }

  const store = await Store.findById(storeId)

  if (!store) {
    const error = new Error('Store not found.')
    error.statusCode = 404
    throw error
  }

  if (!store.is_active) {
    const error = new Error('This store is currently not accepting orders.')
    error.statusCode = 400
    throw error
  }

  const uniqueItemIds = [...new Set(normalizedItems.map((item) => item.menuItemId))]
  const menuItems = await MenuItem.find({ _id: { $in: uniqueItemIds } })
  if (menuItems.length !== uniqueItemIds.length) {
    const error = new Error('One or more items not found.')
    error.statusCode = 400
    throw error
  }

  const menuItemMap = new Map(menuItems.map((menuItem) => [menuItem._id.toString(), menuItem]))

  let totalAmount = 0
  const orderItems = []

  for (const item of normalizedItems) {
    const menuItem = menuItemMap.get(item.menuItemId)

    if (!menuItem) {
      const error = new Error('One or more items not found.')
      error.statusCode = 400
      throw error
    }

    if (menuItem.store_id.toString() !== storeId.toString()) {
      const error = new Error(`Item "${menuItem.name}" does not belong to this store.`)
      error.statusCode = 400
      throw error
    }

    if (!menuItem.is_available) {
      const error = new Error(`Item "${menuItem.name}" is currently unavailable.`)
      error.statusCode = 400
      throw error
    }

    const lineTotal = Number(menuItem.price) * item.quantity
    totalAmount += lineTotal

    orderItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity: item.quantity,
      total: lineTotal,
    })
  }

  totalAmount = Math.round(totalAmount * 100) / 100

  return {
    store,
    normalizedItems,
    orderItems,
    totalAmount,
    specialInstructions: specialInstructions?.trim() || null,
  }
}

export const createCheckoutSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { items, storeId, specialInstructions } = req.body
    await runOrderTimeoutSweep()

    const user = await User.findById(userId).select(
      'no_show_count trust_tier ordering_restricted_until'
    )
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    const restrictionDate = user.ordering_restricted_until
      ? new Date(user.ordering_restricted_until)
      : null
    if (restrictionDate && restrictionDate > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Ordering is temporarily restricted due to repeated no-shows until ${restrictionDate.toLocaleString()}.`,
      })
    }

    const trustTier = getUserTrustTier(user)
    if (user.trust_tier !== trustTier) {
      user.trust_tier = trustTier
      await user.save()
    }

    const draft = await buildOrderDraft({ items, storeId, specialInstructions })
    const paymentReference = await generateUniquePaymentReference()
    const checkoutToken = jwt.sign(
      {
        userId,
        storeId: draft.store._id.toString(),
        items: draft.normalizedItems,
        specialInstructions: draft.specialInstructions,
        totalAmount: draft.totalAmount,
        paymentReference,
      },
      CHECKOUT_TOKEN_SECRET,
      { expiresIn: CHECKOUT_TOKEN_EXPIRY_SECONDS }
    )

    const upiLink = generateUpiLink(
      draft.store.upi_id,
      draft.store.name,
      draft.totalAmount,
      paymentReference
    )
    const upiAppLinks = getUpiAppLinks(upiLink)

    res.json({
      success: true,
      message:
        'Direct store UPI checkout initiated. Pay the exact amount to the store UPI ID to continue.',
      data: {
        checkoutToken,
        paymentReference,
        expiresInSeconds: CHECKOUT_TOKEN_EXPIRY_SECONDS,
        paymentMode: 'direct_store_upi',
        platformFee: 0,
        noShowPolicy: {
          trustTier,
          noShowCount: toSafeInt(user.no_show_count, 0),
          unpaidTimeoutMinutes: UNPAID_ORDER_TIMEOUT_MINUTES,
          readyTimeoutMinutes: READY_NO_SHOW_TIMEOUT_MINUTES,
          requiresCommitmentBeforePrep: trustTier !== 'good',
        },
        store: {
          id: draft.store._id.toString(),
          name: draft.store.name,
          upiId: draft.store.upi_id,
        },
        items: draft.orderItems,
        totalAmount: draft.totalAmount,
        specialInstructions: draft.specialInstructions,
        payment: {
          mode: 'direct_store_upi',
          upiLink,
          upiAppLinks,
          amount: draft.totalAmount,
          storeName: draft.store.name,
          storeUpiId: draft.store.upi_id,
          paymentReference,
        },
      },
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }
    next(error)
  }
}

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { checkoutToken, transactionId } = req.body
    await runOrderTimeoutSweep()

    if (!checkoutToken) {
      return res.status(400).json({
        success: false,
        message: 'Checkout token is required.',
      })
    }

    const user = await User.findById(userId).select(
      'no_show_count trust_tier ordering_restricted_until'
    )
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    const restrictionDate = user.ordering_restricted_until
      ? new Date(user.ordering_restricted_until)
      : null
    if (restrictionDate && restrictionDate > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Ordering is temporarily restricted due to repeated no-shows until ${restrictionDate.toLocaleString()}.`,
      })
    }

    const normalizedTransactionId =
      typeof transactionId === 'string' ? transactionId.trim().toUpperCase() : ''
    if (normalizedTransactionId && !TRANSACTION_ID_REGEX.test(normalizedTransactionId)) {
      return res.status(400).json({
        success: false,
        message:
          'UPI transaction ID must be 8-40 alphanumeric characters when provided.',
      })
    }

    let checkoutData
    try {
      checkoutData = jwt.verify(checkoutToken, CHECKOUT_TOKEN_SECRET)
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Checkout session expired or invalid. Please retry payment.',
      })
    }

    if (checkoutData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid checkout session for this user.',
      })
    }

    const existingOrder = await Order.findOne({
      payment_reference: checkoutData.paymentReference,
    })
      .populate('store_id')
      .lean()

    if (existingOrder) {
      return res.json({
        success: true,
        message: 'Order already placed for this payment reference.',
        data: formatOrder(existingOrder, { store: existingOrder.store_id }),
      })
    }

    if (normalizedTransactionId) {
      const duplicateTransactionOrder = await Order.findOne({
        transaction_id: normalizedTransactionId,
      }).lean()
      if (duplicateTransactionOrder) {
        return res.status(409).json({
          success: false,
          message:
            'This transaction ID is already linked to another order. Please check the ID and try again.',
        })
      }
    }

    const draft = await buildOrderDraft({
      items: checkoutData.items || [],
      storeId: checkoutData.storeId,
      specialInstructions: checkoutData.specialInstructions,
    })

    if (Math.abs(draft.totalAmount - Number(checkoutData.totalAmount || 0)) > 0.01) {
      return res.status(409).json({
        success: false,
        message:
          'Cart details changed during payment. Please retry checkout with updated cart.',
      })
    }

    const order = await Order.create({
      order_number: generateOrderNumber(),
      payment_reference: checkoutData.paymentReference,
      user_id: userId,
      store_id: draft.store._id,
      items: draft.orderItems,
      total_amount: draft.totalAmount,
      payment_status: 'pending',
      payment_method: 'direct_store_upi',
      transaction_id: normalizedTransactionId || null,
      special_instructions: draft.specialInstructions,
      is_commitment_confirmed: false,
      commitment_deadline_at: nowPlusMinutes(ORDER_COMMITMENT_TIMEOUT_MINUTES),
    })

    res.status(201).json({
      success: true,
      message:
        'Order placed. Complete payment and let the store verify before preparation.',
      data: {
        ...formatOrder(order, { store: draft.store }),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getOrders = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const userId = req.user.id
    const role = req.user.role
    const { status, page = 1, limit = 10 } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)
    const skip = (pageNum - 1) * limitNum

    const filter = {}

    if (role === 'store_employee') {
      const store = await Store.findOne({ owner_id: userId }).lean()

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'You do not own a store.',
        })
      }

      filter.store_id = store._id
    } else {
      filter.user_id = userId
    }

    const statuses = parseStatuses(status)
    if (statuses) {
      filter.order_status = statuses.length === 1 ? statuses[0] : { $in: statuses }
    }

    const total = await Order.countDocuments(filter)

    const orders = await Order.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate(role === 'store_employee' ? 'user_id' : 'store_id')

    const formatted = orders.map((order) =>
      role === 'store_employee'
        ? formatOrder(order, { customer: order.user_id })
        : formatOrder(order, { store: order.store_id })
    )

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getOrderById = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params
    const userId = req.user.id
    const role = req.user.role

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    const order = await Order.findById(id)
      .populate('store_id')
      .populate('user_id', 'name email phone_number role register_number employee_id')

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (role === 'store_employee') {
      const ownerStore = await Store.findOne({ owner_id: userId }).lean()
      if (!ownerStore || ownerStore._id.toString() !== order.store_id._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this order.',
        })
      }
    } else if (order.user_id._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.',
      })
    }

    res.json({
      success: true,
      data: formatOrder(order, { store: order.store_id, customer: order.user_id }),
    })
  } catch (error) {
    next(error)
  }
}

export const updatePaymentStatus = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params
    const userId = req.user.id
    const { paymentStatus, transactionId } = req.body

    if (!paymentStatus || !['pending', 'success', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment status is required (pending, success, failed).',
      })
    }

    const order = await Order.findById(id).populate('store_id').populate(
      'user_id',
      'name email no_show_count trust_tier'
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (order.store_id.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order.',
      })
    }

    const normalizedTransactionId = transactionId?.trim().toUpperCase()
    if (normalizedTransactionId) {
      const duplicateTransactionOrder = await Order.findOne({
        transaction_id: normalizedTransactionId,
        _id: { $ne: order._id },
      }).lean()

      if (duplicateTransactionOrder) {
        return res.status(409).json({
          success: false,
          message:
            'This transaction ID is already linked to another order.',
        })
      }

      order.transaction_id = normalizedTransactionId
    }

    order.payment_status = paymentStatus

    if (paymentStatus === 'success' && order.order_status === 'placed') {
      const trustTier = getUserTrustTier(order.user_id)
      const requiresCommitment =
        trustTier !== 'good' || toSafeInt(order.user_id.no_show_count, 0) >= NO_SHOW_WARNING_THRESHOLD

      if (!requiresCommitment || order.is_commitment_confirmed) {
        order.order_status = 'accepted'
      }
    }
    if (paymentStatus === 'failed') {
      order.order_status = 'cancelled'
      order.cancelled_at = new Date()
      order.cancellation_reason = 'payment_failed'
    }

    await order.save()

    if (paymentStatus === 'success') {
      try {
        await sendOrderStatusUpdate(
          order.user_id.email,
          order.user_id.name,
          formatOrder(order),
          'accepted'
        )
      } catch (emailError) {
        console.error('Failed to send order status update email:', emailError)
      }
    }

    res.json({
      success: true,
      message:
        paymentStatus === 'success' && order.order_status === 'placed'
          ? 'Payment confirmed. Waiting for customer commitment before preparation.'
          : 'Payment status updated successfully.',
      data: { order: formatOrder(order, { store: order.store_id, customer: order.user_id }) },
    })
  } catch (error) {
    next(error)
  }
}

export const updateOrderStatus = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params
    const userId = req.user.id
    const { status } = req.body

    const validTransitions = {
      placed: ['accepted'],
      accepted: ['processing'],
      processing: ['ready'],
      ready: ['picked_up'],
    }

    const order = await Order.findById(id).populate('store_id').populate(
      'user_id',
      'name email no_show_count trust_tier'
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (order.store_id.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order.',
      })
    }

    if (order.payment_status !== 'success') {
      return res.status(400).json({
        success: false,
        message:
          'Order status cannot be updated until payment is verified as successful.',
      })
    }

    const allowedNextStatuses = validTransitions[order.order_status]
    if (!allowedNextStatuses || !allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${order.order_status}" to "${status}".`,
      })
    }

    if (status === 'accepted' && order.order_status === 'placed') {
      const trustTier = getUserTrustTier(order.user_id)
      const requiresCommitment =
        trustTier !== 'good' || toSafeInt(order.user_id.no_show_count, 0) >= NO_SHOW_WARNING_THRESHOLD
      if (requiresCommitment && !order.is_commitment_confirmed) {
        return res.status(400).json({
          success: false,
          message:
            'Customer must confirm they are on the way before this order can be accepted.',
        })
      }
    }

    if (status === 'picked_up' && !order.is_otp_verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be verified before marking as picked up.',
      })
    }

    let generatedOtp = null
    if (status === 'ready') {
      generatedOtp = generateOtp()
      order.otp = generatedOtp
      order.otp_expires_at = getOtpExpiry()
      order.is_otp_verified = false
      order.ready_at = new Date()
      order.ready_expires_at = nowPlusMinutes(READY_NO_SHOW_TIMEOUT_MINUTES)
    }

    order.order_status = status
    if (status === 'picked_up') {
      order.ready_expires_at = null
      order.cancellation_reason = null
    }
    await order.save()

    try {
      await sendOrderStatusUpdate(
        order.user_id.email,
        order.user_id.name,
        formatOrder(order),
        status
      )

      if (status === 'ready' && generatedOtp) {
        await sendOtpEmail(
          order.user_id.email,
          order.user_id.name,
          generatedOtp,
          order.order_number
        )
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
    }

    const responseData = {
      order: formatOrder(order, { store: order.store_id, customer: order.user_id }),
    }

    if (generatedOtp) {
      responseData.otp = generatedOtp
    }

    res.json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: responseData,
    })
  } catch (error) {
    next(error)
  }
}

export const verifyOrderOtp = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params
    const userId = req.user.id
    const { otp, manualConfirm } = req.body

    if (!otp && manualConfirm !== true) {
      return res.status(400).json({
        success: false,
        message: 'Provide OTP or confirm manual OTP verification.',
      })
    }

    const order = await Order.findById(id).populate('store_id').populate('user_id', 'name email')

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (order.store_id.owner_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to verify OTP for this order.',
      })
    }

    if (order.order_status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'OTP can only be verified when order status is "ready".',
      })
    }

    if (otp) {
      const isValid = validateOtp(order.otp, otp, order.otp_expires_at)

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP.',
        })
      }
    } else {
      const isStillValid = validateOtp(order.otp, order.otp, order.otp_expires_at)
      if (!isStillValid) {
        return res.status(400).json({
          success: false,
          message: 'OTP expired. Mark order ready again to generate a new OTP.',
        })
      }
    }

    order.is_otp_verified = true
    order.order_status = 'picked_up'
    order.ready_expires_at = null
    order.cancellation_reason = null
    await order.save()

    try {
      await sendOrderStatusUpdate(
        order.user_id.email,
        order.user_id.name,
        formatOrder(order),
        'picked_up'
      )
    } catch (emailError) {
      console.error('Failed to send pickup confirmation email:', emailError)
    }

    res.json({
      success: true,
      message: 'OTP verified. Order marked as picked up.',
      data: { order: formatOrder(order, { store: order.store_id, customer: order.user_id }) },
    })
  } catch (error) {
    next(error)
  }
}

export const confirmOrderCommitment = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params
    const userId = req.user.id

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    const order = await Order.findById(id).populate('store_id').populate('user_id', 'name email')

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (order.user_id._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm commitment for this order.',
      })
    }

    if (order.order_status === 'picked_up' || order.order_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Commitment can only be updated for active orders.',
      })
    }

    order.is_commitment_confirmed = true
    order.commitment_confirmed_at = new Date()
    order.commitment_deadline_at = null
    await order.save()

    res.json({
      success: true,
      message: 'Commitment confirmed. Store can proceed with preparation.',
      data: { order: formatOrder(order, { store: order.store_id, customer: order.user_id }) },
    })
  } catch (error) {
    next(error)
  }
}

export const pollOrderStatus = async (req, res, next) => {
  try {
    await runOrderTimeoutSweep()
    const { id } = req.params

    const order = await Order.findById(id).lean()

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    res.json({
      success: true,
      data: formatOrder(order),
    })
  } catch (error) {
    next(error)
  }
}
