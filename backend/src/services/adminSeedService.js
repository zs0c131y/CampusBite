import bcrypt from 'bcryptjs'
import User from '../models/User.js'

export const seedAdmin = async ({ email = 'adarsh@campusbite', password = 'password1234' } = {}) => {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    if (existing.role !== 'admin') throw new Error('This email belongs to a non-admin account. Seed aborted.')
    return { created: false, email: normalizedEmail }
  }
  await User.create({
    name: 'Adarsh', email: normalizedEmail, role: 'admin', is_email_verified: true,
    password: await bcrypt.hash(password, 12),
  })
  return { created: true, email: normalizedEmail }
}
