const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

const getBackendOrigin = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL || '')
  if (configured) return configured

  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }

  return ''
}

export const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return ''

  const raw = value.trim()
  if (!raw) return ''

  if (/^(blob:|data:|https?:\/\/)/i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`

  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`
  const backendOrigin = getBackendOrigin()

  if (backendOrigin) {
    return `${backendOrigin}${normalizedPath}`
  }

  return normalizedPath
}
