import mongoose from 'mongoose'

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.')
  }
  return uri
}

export const initDatabase = async () => {
  const uri = getMongoUri()
  const dbName = process.env.MONGODB_DB_NAME || undefined

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    })
  } catch (error) {
    const causeMessage = error?.message || ''
    const usingSrv = uri.startsWith('mongodb+srv://')
    const isSrvDnsError =
      causeMessage.includes('querySrv ECONNREFUSED') ||
      causeMessage.includes('querySrv ENOTFOUND') ||
      causeMessage.includes('querySrv ETIMEOUT')

    let guidance = 'Check MONGODB_URI and ensure MongoDB is running and reachable.'
    if (usingSrv && isSrvDnsError) {
      guidance =
        'SRV DNS lookup failed. Your network/DNS is blocking Atlas SRV resolution. Use Atlas non-SRV connection string (mongodb://...) or fix DNS access.'
    }

    const startupError = new Error(`MongoDB connection failed. ${guidance}`)
    startupError.cause = error
    throw startupError
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`MongoDB connected${dbName ? ` (${dbName})` : ''}`)
  }
}

export default mongoose
