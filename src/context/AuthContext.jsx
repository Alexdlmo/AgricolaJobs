import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { login as authLogin, register as authRegister, logout as authLogout } from '../utils/authService'

const STORAGE_KEY_PATTERNS = [
  key => key.startsWith('supabase.auth.'),
  key => key.startsWith('sb-') && key.endsWith('-auth-token'),
  key => key.startsWith('sb-') && key.endsWith('-auth-token-code-verifier'),
]

function clearSupabaseKeys() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && STORAGE_KEY_PATTERNS.some(match => match(key))) {
      localStorage.removeItem(key)
    }
  }
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const metadataToUser = (session) => ({
    id: session.user.id,
    email: session.user.email,
    role: session.user.user_metadata?.role || 'worker',
    name: session.user.user_metadata?.name || '',
    phone: session.user.user_metadata?.phone || ''
  })

  const fetchProfileInBackground = (session) => {
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setUser(data)
      })
      .catch(() => {})
  }

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION') {
        if (session) {
          setUser(metadataToUser(session))
          fetchProfileInBackground(session)
        } else {
          clearSupabaseKeys()
        }
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          setUser(metadataToUser(session))
          fetchProfileInBackground(session)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        clearSupabaseKeys()
      }
    })

    return () => {
      mounted = false
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
