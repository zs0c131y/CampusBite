import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import User from '../models/User.js'
import Store from '../models/Store.js'
import RefreshToken from '../models/RefreshToken.js'
import { formatUser } from '../utils/formatters.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js'

const CHRIST_UNIVERSITY_DOMAIN = 'christuniversity.in'
const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/

const isChristUniversityEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1]
  if (!domain) return false
  return domain === CHRIST_UNIVERSITY_DOMAIN || domain.endsWith(`.${CHRIST_UNIVERSITY_DOMAIN}`)
}

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

const toDateFromDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'faculty', 'store_employee']),
    registerNumber: z.string().optional(),
    employeeId: z.string().optional(),
    phoneNumber: z.string().optional(),
    storeName: z.string().optional(),
    storeUpiId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }

    if (data.role === 'student' && (!data.registerNumber || data.registerNumber.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Register number is required for students',
        path: ['registerNumber'],
      })
    }

    if (
      (data.role === 'student' || data.role === 'faculty') &&
      !isChristUniversityEmail(data.email)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Student and faculty accounts must use a christuniversity.in email (subdomains are allowed).',
        path: ['email'],
      })
    }

    if ((data.role === 'faculty' || data.role === 'store_employee') && (!data.employeeId || data.employeeId.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Employee ID is required',
        path: ['employeeId'],
      })
    }

    if (data.role === 'store_employee') {
      if (!data.phoneNumber || !/^[6-9]\d{9}$/.test(data.phoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid Indian mobile number is required for store employees',
          path: ['phoneNumber'],
        })
      }

      if (!data.storeName || data.storeName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Store name is required for store employees',
          path: ['storeName'],
        })
      }

      if (!data.storeUpiId || data.storeUpiId.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Store UPI ID is required for store employees',
          path: ['storeUpiId'],
        })
      } else if (!UPI_ID_REGEX.test(data.storeUpiId.trim().toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Store UPI ID format is invalid',
          path: ['storeUpiId'],
        })
      }
    }
  })

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  })

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })

  return { accessToken, refreshToken }
}

export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      registerNumber,
      employeeId,
      phoneNumber,
      storeName,
      storeUpiId,
    } = req.body

    const normalizedEmail = email.trim().toLowerCase()

    if ((role === 'student' || role === 'faculty') && !isChristUniversityEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          'Student and faculty accounts must use a christuniversity.in email (subdomains are allowed).',
      })
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).lean()
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      register_number: registerNumber || null,
      employee_id: employeeId || null,
      phone_number: phoneNumber || null,
      email_verification_token: emailVerificationToken,
    })

    if (role === 'store_employee') {
      await Store.create({
        name: storeName.trim(),
        upi_id: storeUpiId.trim().toLowerCase(),
        owner_id: user._id,
      })
    }

    try {
      await sendVerificationEmail(user.email, user.name, emailVerificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.trim().toLowerCase()

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
      })
    }

    const userId = user._id.toString()
    const { accessToken, refreshToken } = generateTokens(userId)

    await RefreshToken.create({
      user_id: user._id,
      token: refreshToken,
      expires_at: toDateFromDays(7),
    })

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      })
    }

    const user = await User.findOne({ email_verification_token: token })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      })
    }

    if (!user.is_email_verified) {
      user.is_email_verified = true
      await user.save()
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    })
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date()
    resetExpires.setHours(resetExpires.getHours() + 1)

    user.password_reset_token = resetToken
    user.password_reset_expires = resetExpires
    await user.save()

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      })
    }

    const user = await User.findOne({
      password_reset_token: token,
      password_reset_expires: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      })
    }

    user.password = await bcrypt.hash(password, 12)
    user.password_reset_token = null
    user.password_reset_expires = null
    await user.save()

    await RefreshToken.deleteMany({ user_id: user._id })

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    })
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      })
    }

    const tokenDoc = await RefreshToken.findOne({
      token,
      user_id: decoded.userId,
      expires_at: { $gt: new Date() },
    })

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or expired.',
      })
    }

    await RefreshToken.deleteOne({ _id: tokenDoc._id })

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId)

    await RefreshToken.create({
      user_id: decoded.userId,
      token: newRefreshToken,
      expires_at: toDateFromDays(7),
    })

    res.json({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body

    if (token) {
      await RefreshToken.deleteMany({ token })
    }

    res.json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error) {
    next(error)
  }
}
