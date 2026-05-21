import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Tractor, Building2 } from 'lucide-react'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState('worker')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
            <Tractor size={18} />
            Trabajador
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'company' ? 'active' : ''}`}
            onClick={() => setRole('company')}
          >
            <Building2 size={18} />
            Empresa
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
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
              <Lock size={18} className="input-icon" />
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
        <p className="auth-footer" style={{ marginTop: '0.5rem' }}>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
      </div>
    </div>
  )
}

export default Login