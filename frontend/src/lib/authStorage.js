const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'
const REMEMBER_ME_KEY = 'rememberMe'

const isBrowser = typeof window !== 'undefined'

const getStorage = (type) => {
  if (!isBrowser) return null
  return type === 'session' ? window.sessionStorage : window.localStorage
}

const clearFromStorage = (storage) => {
  if (!storage) return
  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
  storage.removeItem(USER_KEY)
}

const getPreferredStorageType = () => {
  if (!isBrowser) return 'local'

  const localHasAuth =
    !!window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
    !!window.localStorage.getItem(REFRESH_TOKEN_KEY)
  if (localHasAuth) return 'local'

  const sessionHasAuth =
    !!window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    !!window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
  if (sessionHasAuth) return 'session'

  return window.localStorage.getItem(REMEMBER_ME_KEY) === 'true' ? 'local' : 'session'
}

export const isRememberMeEnabled = () => {
  if (!isBrowser) return false
  return window.localStorage.getItem(REMEMBER_ME_KEY) === 'true'
}

export const getAccessToken = () => {
  if (!isBrowser) return null
  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  )
}

export const getRefreshToken = () => {
  if (!isBrowser) return null
  return (
    window.localStorage.getItem(REFRESH_TOKEN_KEY) ||
    window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
  )
}

export const getStoredUser = () => {
  if (!isBrowser) return null
  return window.localStorage.getItem(USER_KEY) || window.sessionStorage.getItem(USER_KEY)
}

export const setAuthData = ({ accessToken, refreshToken, user, rememberMe }) => {
  if (!isBrowser) return

  const targetType = rememberMe ? 'local' : 'session'
  const targetStorage = getStorage(targetType)
  const otherStorage = getStorage(targetType === 'local' ? 'session' : 'local')

  clearFromStorage(otherStorage)
  if (rememberMe) {
    window.localStorage.setItem(REMEMBER_ME_KEY, 'true')
  } else {
    window.localStorage.removeItem(REMEMBER_ME_KEY)
  }

  if (accessToken) targetStorage?.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) targetStorage?.setItem(REFRESH_TOKEN_KEY, refreshToken)
  if (user) targetStorage?.setItem(USER_KEY, JSON.stringify(user))
}

export const setStoredUser = (user) => {
  if (!isBrowser) return
  const targetStorage = getStorage(getPreferredStorageType())
  if (!user) {
    targetStorage?.removeItem(USER_KEY)
    return
  }
  targetStorage?.setItem(USER_KEY, JSON.stringify(user))
}

export const updateAuthTokens = ({ accessToken, refreshToken }) => {
  if (!isBrowser) return
  const targetStorage = getStorage(getPreferredStorageType())
  if (accessToken) targetStorage?.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) targetStorage?.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearAuthData = () => {
  if (!isBrowser) return
  clearFromStorage(window.localStorage)
  clearFromStorage(window.sessionStorage)
  window.localStorage.removeItem(REMEMBER_ME_KEY)
}
