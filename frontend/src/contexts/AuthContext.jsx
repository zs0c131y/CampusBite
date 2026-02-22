import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import {
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthData,
  setStoredUser,
} from '@/lib/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken()
      const storedUser = getStoredUser()
      if (token && storedUser) {
        try {
          const { data } = await api.get('/users/profile')
          if (data.success) {
            setUser(data.data)
            setStoredUser(data.data)
          }
        } catch {
          clearAuthData()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.success) {
      setAuthData({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        user: data.data.user,
        rememberMe,
      })
      setUser(data.data.user)
    }
    return data
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      /* ignore logout errors */
    }
    clearAuthData()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    const { data } = await api.put('/users/profile', profileData)
    if (data.success) {
      setUser(data.data)
      setStoredUser(data.data)
    }
    return data
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
