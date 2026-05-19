import { createContext, useContext, useState, useEffect } from 'react'
import { getSession, logout as authLogout, login as authLogin, register as authRegister } from '../utils/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      setUser(getSession())
      setLoading(false)
    }

    initAuth()

    const handleStorageChange = () => {
      setUser(getSession())
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
    }
  }, [])

  const login = async (email, password) => {
    const userData = await authLogin(email, password)
    setUser(userData)
    window.dispatchEvent(new Event('auth-change'))
    return userData
  }

  const register = async (userData) => {
    const newUser = await authRegister(userData)
    setUser(newUser)
    window.dispatchEvent(new Event('auth-change'))
    return newUser
  }

  const logout = () => {
    authLogout()
    setUser(null)
    window.dispatchEvent(new Event('auth-change'))
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}