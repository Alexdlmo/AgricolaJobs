import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { validateResetToken, resetPassword } from '../utils/authService'
import './Login.css'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const result = await validateResetToken(token)
        if (!result.valid) {
          setError(result.reason)
        }
      } catch (err) {
        setError('El enlace de recuperación no es válido')
      } finally {
        setValidating(false)
        setLoading(false)
      }
    }

    if (token) {
      validateToken()
    } else {
      setError('Token no proporcionado')
      setLoading(false)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading || validating) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/favicon.png" alt="logo" className="logo-img" />
              <span className="logo-text">Agrícola Jobs</span>
            </div>
            <h1>Validando enlace...</h1>
          </div>
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Por favor espera mientras verificamos tu enlace de recuperación.
          </p>
        </div>
      </div>
    )
  }

  if (error && !validating) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/favicon.png" alt="logo" className="logo-img" />
              <span className="logo-text">Agrícola Jobs</span>
            </div>
            <h1>Enlace no válido</h1>
          </div>

          <div className="error-message" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>

          <p className="auth-footer">
            <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
          </p>
          <p className="auth-footer">
            <Link to="/login">← Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/favicon.png" alt="logo" className="logo-img" />
              <span className="logo-text">Agrícola Jobs</span>
            </div>
            <h1>Contraseña actualizada</h1>
          </div>

          <div className="success-message" style={{ 
            background: '#dcfce7', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <CheckCircle size={24} style={{ color: '#16a34a', marginRight: '0.5rem' }} />
            <span style={{ color: '#16a34a' }}>Tu contraseña ha sido actualizada correctamente</span>
          </div>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' }}>
            Serás redirigido al inicio de sesión en unos segundos...
          </p>

          <p className="auth-footer">
            <Link to="/login">← Ir al login ahora</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/favicon.png" alt="logo" className="logo-img" />
            <span className="logo-text">Agrícola Jobs</span>
          </div>
          <h1>Nueva contraseña</h1>
          <p className="auth-subtitle">Establece una nueva contraseña para tu cuenta</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nueva contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword