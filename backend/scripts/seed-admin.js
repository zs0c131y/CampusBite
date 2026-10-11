import 'dotenv/config'
import mongoose from 'mongoose'
import { initDatabase } from '../src/config/db.js'
import { seedAdmin } from '../src/services/adminSeedService.js'

try {
  await initDatabase()
  const result = await seedAdmin({ email: process.env.ADMIN_EMAIL || undefined, password: process.env.ADMIN_PASSWORD || undefined })
  console.log(result.created ? `Admin account created: ${result.email}` : 'Admin account already exists; credentials were preserved.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
