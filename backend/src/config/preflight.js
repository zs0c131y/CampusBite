const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
]

const SMTP_ENV_VARS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'FROM_EMAIL',
]

const getMissingEnvVars = (keys) =>
  keys.filter((key) => !process.env[key] || String(process.env[key]).trim() === '')

export const runStartupPreflight = () => {
  const missingRequired = getMissingEnvVars(REQUIRED_ENV_VARS)
  if (missingRequired.length > 0) {
    throw new Error(
      `[Startup] Missing required environment variables: ${missingRequired.join(', ')}`
    )
  }

  const dbType = (process.env.DB_TYPE || 'mongodb').toLowerCase()
  if (dbType !== 'mongodb') {
    console.warn(
      `[Startup] DB_TYPE is set to "${dbType}". This backend is configured for MongoDB.`
    )
  }

  const missingSmtp = getMissingEnvVars(SMTP_ENV_VARS)
  if (missingSmtp.length > 0) {
    console.warn(
      `[Startup] SMTP is not fully configured. Missing: ${missingSmtp.join(
        ', '
      )}. Email features will be skipped.`
    )
  }
}
