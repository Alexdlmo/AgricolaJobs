import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { requestPasswordReset } from '../utils/authService'
import './Login.css'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      setSuccess(true)
      setResetToken(result.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            <h1>Correo enviado</h1>
            <p className="auth-subtitle">Hemos generado un enlace para recuperar tu contraseña</p>
          </div>

          <div className="success-message" style={{ 
            background: '#dcfce7', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle size={24} style={{ color: '#16a34a', marginRight: '0.5rem' }} />
            <span style={{ color: '#16a34a' }}>Se ha generado tu enlace de recuperación</span>
          </div>

          <div style={{ 
            background: '#f9fafb', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ marginBottom: '1rem', color: '#374151' }}>
              <strong>Instrucciones:</strong> Copia el siguiente token y úsalo para crear una nueva contraseña.
            </p>
            <p style={{ marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
              Token de recuperación:
            </p>
            <code style={{ 
              display: 'block',
              background: '#fff',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              wordBreak: 'break-all',
              fontSize: '0.8rem'
            }}>
              {resetToken}
            </code>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.75rem', color: '#374151' }}>
              Haz clic en el siguiente enlace para establecer tu nueva contraseña:
            </p>
            <a 
              href={`http://localhost:5173/reset-password/${resetToken}`}
              style={{
                display: 'inline-block',
                background: '#2d5016',
                color: '#fff',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Restablecer mi contraseña
            </a>
          </div>

          <p className="auth-footer">
            <Link to="/login">← Volver al inicio de sesión</Link>
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
          <h1>Recuperar contraseña</h1>
          <p className="auth-subtitle">Introduce tu email para recibir un enlace de recuperación</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword