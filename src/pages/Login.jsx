import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, createAdminIfNotExists } from '../utils/authService'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('worker')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createAdminIfNotExists()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/favicon.png" alt="logo" className="logo-img" />
            <span className="logo-text">Agrícola Jobs</span>
          </div>
          <h1>Iniciar sesión</h1>
          <p className="auth-subtitle">Accede a tu cuenta</p>
        </div>

        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'worker' ? 'active' : ''}`}
            onClick={() => setRole('worker')}
          >
            <span className="tab-icon">👨‍🌾</span>
            Trabajador
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'company' ? 'active' : ''}`}
            onClick={() => setRole('company')}
          >
            <span className="tab-icon">🏢</span>
            Empresa
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder={role === 'worker' ? 'tu@email.com' : 'empresa@email.com'}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}

export default Login