import User from '../models/User.js'
import Store from '../models/Store.js'
import { formatUser, formatStore } from '../utils/formatters.js'

const sanitizeUser = (userDoc) => {
  const user = formatUser(userDoc)
  if (!user) return null
  delete user.password
  delete user.email_verification_token
  delete user.password_reset_token
  delete user.password_reset_expires
  delete user.__v
  return user
}

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).lean()

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    let store = null
    if (user.role === 'store_employee') {
      const storeDoc = await Store.findOne({ owner_id: userId }).lean()
      if (storeDoc) {
        store = formatStore(storeDoc)
      }
    }

    res.json({
      success: true,
      data: {
        ...sanitizeUser(user),
        store,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { name, phoneNumber } = req.body

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    if (name) user.name = name
    if (phoneNumber !== undefined) user.phone_number = phoneNumber

    await user.save()

    let store = null
    if (user.role === 'store_employee') {
      const storeDoc = await Store.findOne({ owner_id: userId }).lean()
      if (storeDoc) {
        store = formatStore(storeDoc)
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        ...sanitizeUser(user),
        store,
      },
    })
  } catch (error) {
    next(error)
  }
}
