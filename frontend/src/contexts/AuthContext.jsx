import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loginCallbacks, setLoginCallbacks] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await authAPI.getProfile()
      // Handle nested data structure from backend
      const userData = response.data.data || response.data
      setUser(userData)
      // Execute any pending login callbacks
      loginCallbacks.forEach(callback => callback())
      setLoginCallbacks([])
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('authToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      console.log('Attempting login with:', credentials)
      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data)
      
      // Handle nested data structure from backend
      const { data } = response.data
      const { token, user: userData } = data
      
      localStorage.setItem('authToken', token)
      setUser(userData)
      console.log('User set to:', userData)
      console.log('isAuthenticated will be:', !!userData)
      
      // Execute any pending login callbacks
      loginCallbacks.forEach(callback => callback())
      setLoginCallbacks([])
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await authAPI.register(userData)
      // Handle nested data structure from backend
      const { data } = response.data
      const { token, user: newUser } = data
      
      localStorage.setItem('authToken', token)
      setUser(newUser)
      
      // Execute any pending login callbacks
      loginCallbacks.forEach(callback => callback())
      setLoginCallbacks([])
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setError(null)
    setLoginCallbacks([])
  }

  const onLogin = (callback) => {
    if (user) {
      // If already logged in, execute immediately
      callback()
    } else {
      // Otherwise, queue it for when login happens
      setLoginCallbacks(prev => [...prev, callback])
    }
  }

  const updateProfile = async (data) => {
    try {
      setError(null)
      const response = await authAPI.updateProfile(data)
      // Handle nested data structure from backend
      const userData = response.data.data || response.data
      setUser(userData)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    checkAuth,
    onLogin,
  }

  console.log('AuthContext state:', { 
    user: user ? { id: user.id, username: user.username } : null, 
    loading, 
    isAuthenticated: !!user,
    tokenExists: !!localStorage.getItem('authToken')
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 