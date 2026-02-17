import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      const storedUser = localStorage.getItem('user')
      if (token && storedUser) {
        try {
          const { data } = await api.get('/users/profile')
          if (data.success) {
            setUser(data.data)
            localStorage.setItem('user', JSON.stringify(data.data))
          }
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.data.user))
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
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      /* ignore logout errors */
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    const { data } = await api.put('/users/profile', profileData)
    if (data.success) {
      setUser(data.data)
      localStorage.setItem('user', JSON.stringify(data.data))
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
