import axios from 'axios'
import {
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  updateAuthTokens,
} from '@/lib/authStorage'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set multipart boundaries automatically for FormData payloads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post('/api/auth/refresh-token', { refreshToken })
        if (data.success) {
          updateAuthTokens({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          })
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        clearAuthData()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api
