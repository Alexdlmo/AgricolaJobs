import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { login as authLogin, register as authRegister, logout as authLogout } from '../utils/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async (session) => {
      if (!session) return null
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) return profile
      } catch {
        // Error al obtener perfil, se usan datos del metadata
      }
      return {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role || 'worker',
        name: session.user.user_metadata?.name || '',
        phone: session.user.user_metadata?.phone || ''
      }
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const profile = await fetchUserProfile(session)
          setUser(profile)
        }
      } catch {
        // Error al restaurar sesión
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            const profile = await fetchUserProfile(session)
            setUser(profile)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      } catch {
        // Error en cambio de autenticación
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const userData = await authLogin(email, password)
    setUser(userData)
    return userData
  }

  const register = async (userData) => {
    const newUser = await authRegister(userData)
    setUser(newUser)
    return newUser
  }

  const logout = async () => {
    await authLogout()
    setUser(null)
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
