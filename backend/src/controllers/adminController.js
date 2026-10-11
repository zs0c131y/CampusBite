import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { z } from 'zod'
import User from '../models/User.js'
import Store from '../models/Store.js'
import Order from '../models/Order.js'
import RefreshToken from '../models/RefreshToken.js'
import { formatUser, formatStore } from '../utils/formatters.js'

const publicUserFields = '-password -email_verification_token -password_reset_token -password_reset_expires -__v'
const roles = ['student', 'faculty', 'store_employee', 'admin']
const orderStatuses = ['placed', 'accepted', 'processing', 'ready', 'picked_up', 'cancelled']
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const pagination = (req) => ({
  page: Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1)),
  limit: 20,
})
const fail = (res, status, message) => res.status(status).json({ success: false, message })

export const validId = (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return fail(res, 400, 'Invalid ID.')
  next()
}

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phoneNumber: z.string().trim().refine((value) => value === '' || /^[6-9]\d{9}$/.test(value), 'Enter a valid Indian mobile number.'),
  role: z.enum(roles),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  clearRestriction: z.boolean().optional(),
}).strict()

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().refine((value) => value === 'adarsh@campusbite' || z.email().safeParse(value).success, 'Enter a valid email address.'),
  currentPassword: z.string().min(1),
  newPassword: z.string().max(128).refine((value) => value === '' || (value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value)), 'New password needs 8 characters, an uppercase letter, a lowercase letter and a number.'),
}).strict()

export const getOverview = async (req, res, next) => {
  try {
    const [users, stores, orders, activeOrders, revenue, rolesSummary] = await Promise.all([
      User.countDocuments(), Store.countDocuments(), Order.countDocuments(),
      Order.countDocuments({ order_status: { $in: ['placed', 'accepted', 'processing', 'ready'] } }),
      Order.aggregate([{ $match: { payment_status: 'success' } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ])
    res.json({ success: true, data: { users, stores, orders, activeOrders, revenue: revenue[0]?.total || 0, roles: rolesSummary } })
  } catch (error) { next(error) }
}

export const listUsers = async (req, res, next) => {
  try {
    const { page, limit } = pagination(req)
    const filter = {}
    const search = String(req.query.search || '').trim().slice(0, 100)
    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' }
      filter.$or = [{ name: pattern }, { email: pattern }, { register_number: pattern }, { employee_id: pattern }]
    }
    if (roles.includes(req.query.role)) filter.role = req.query.role
    const [users, total] = await Promise.all([
      User.find(filter).select(publicUserFields).sort({ created_at: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ])
    res.json({ success: true, data: { users: users.map(formatUser), total, page, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return fail(res, 404, 'User not found.')
    const body = req.body
    // Admin access is managed separately from ordinary campus accounts.
    if (user.role === 'admin' || body.role === 'admin') return fail(res, 403, 'Admin accounts cannot be changed here. Use Account settings for your own account.')
    if (body.role === 'store_employee' && user.role !== 'store_employee') return fail(res, 400, 'Store employees must register with their store details.')
    if (user.role === 'store_employee' && body.role !== user.role && await Store.exists({ owner_id: user._id })) return fail(res, 400, 'A store owner must keep the store employee role.')
    Object.assign(user, { name: body.name, phone_number: body.phoneNumber || null, role: body.role, is_active: body.isActive, is_email_verified: body.isEmailVerified })
    if (!body.isActive || !body.isEmailVerified) user.auth_version = (user.auth_version || 0) + 1
    if (body.clearRestriction) Object.assign(user, { no_show_count: 0, trust_tier: 'good', ordering_restricted_until: null, last_no_show_at: null })
    await user.save()
    if (!body.isActive || !body.isEmailVerified) await RefreshToken.deleteMany({ user_id: user._id })
    const safe = await User.findById(user._id).select(publicUserFields).lean()
    res.json({ success: true, message: 'User updated.', data: formatUser(safe) })
  } catch (error) { next(error) }
}

export const listStores = async (req, res, next) => {
  try {
    const { page, limit } = pagination(req)
    const [stores, total] = await Promise.all([
      Store.find().populate('owner_id', 'name email phone_number').sort({ created_at: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Store.countDocuments(),
    ])
    res.json({ success: true, data: { stores: stores.map((store) => formatStore(store, store.owner_id)), total, page, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const setStoreStatus = async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { is_active: req.body.isActive }, { new: true, runValidators: true })
    if (!store) return fail(res, 404, 'Store not found.')
    res.json({ success: true, message: 'Store availability updated.', data: formatStore(store) })
  } catch (error) { next(error) }
}

export const listOrders = async (req, res, next) => {
  try {
    const { page, limit } = pagination(req)
    const filter = {}
    if (orderStatuses.includes(req.query.status)) filter.order_status = req.query.status
    if (['pending', 'success', 'failed'].includes(req.query.payment)) filter.payment_status = req.query.payment
    const search = String(req.query.search || '').trim().slice(0, 100)
    if (search) filter.order_number = { $regex: escapeRegex(search), $options: 'i' }
    const [orders, total] = await Promise.all([
      Order.find(filter).select('order_number total_amount order_status payment_status created_at items user_id store_id')
        .populate('user_id', 'name email').populate('store_id', 'name').sort({ created_at: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ])
    res.json({ success: true, data: { orders: orders.map((order) => ({ id: order._id.toString(), orderNumber: order.order_number, totalAmount: order.total_amount, status: order.order_status, paymentStatus: order.payment_status, createdAt: order.created_at, items: order.items, customer: order.user_id, store: order.store_id })), total, page, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const updateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user || !await bcrypt.compare(req.body.currentPassword, user.password)) return fail(res, 400, 'Current password is incorrect.')
    const duplicate = await User.exists({ email: req.body.email, _id: { $ne: user._id } })
    if (duplicate) return fail(res, 409, 'This email is already in use.')
    user.name = req.body.name
    user.email = req.body.email
    if (req.body.newPassword) user.password = await bcrypt.hash(req.body.newPassword, 12)
    user.password_reset_token = null
    user.password_reset_expires = null
    user.email_verification_token = null
    user.auth_version = (user.auth_version || 0) + 1
    await user.save()
    await RefreshToken.deleteMany({ user_id: user._id })
    res.json({ success: true, message: 'Account updated. Sign in with your updated credentials.' })
  } catch (error) {
    if (error.code === 11000) return fail(res, 409, 'This email is already in use.')
    next(error)
  }
}
