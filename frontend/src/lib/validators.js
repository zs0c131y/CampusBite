const CHRIST_UNIVERSITY_DOMAIN = 'christuniversity.in'

export function validateName(name) {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' }
  }
  return { valid: true, error: null }
}

export function isChristUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1]
  if (!domain) return false
  return domain === CHRIST_UNIVERSITY_DOMAIN || domain.endsWith(`.${CHRIST_UNIVERSITY_DOMAIN}`)
}

export function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }
  return { valid: true, error: null }
}

export function validateChristUniversityEmail(email) {
  const baseValidation = validateEmail(email)
  if (!baseValidation.valid) return baseValidation

  if (!isChristUniversityEmail(email)) {
    return {
      valid: false,
      error: 'Use your christuniversity.in email (subdomains like course.christuniversity.in are allowed)',
    }
  }

  return { valid: true, error: null }
}

export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit' }
  }
  return { valid: true, error: null }
}

export function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' }
  }
  const phoneRegex = /^[6-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number' }
  }
  return { valid: true, error: null }
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true, error: null }
}

export function validateUpiId(upiId) {
  if (!upiId || !upiId.trim()) {
    return { valid: false, error: 'UPI ID is required' }
  }

  const normalized = upiId.trim().toLowerCase()
  const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/
  if (!upiRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Enter a valid UPI ID (e.g., campusbite@paytm or 9876543210@ybl)',
    }
  }

  return { valid: true, error: null }
}
