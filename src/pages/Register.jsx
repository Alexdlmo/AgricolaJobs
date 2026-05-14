import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register } from '../utils/authService'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState(() => searchParams.get('role') || 'worker')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    cif: '',
    contactPerson: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' }
    if (password.length < 6) return { strength: 1, text: 'Muy débil', color: '#ef4444' }
    if (password.length >= 6 && password.length < 8) return { strength: 2, text: 'Débil', color: '#f97316' }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return { strength: 4, text: 'Fuerte', color: '#22c55e' }
    return { strength: 3, text: 'Media', color: '#eab308' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    setLoading(true)

    try {
      await register({
        ...formData,
        role,
        name: role === 'worker' ? formData.name : formData.companyName,
        phone: formData.phone
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/favicon.png" alt="logo" className="logo-img" />
            <span className="logo-text">Agrícola Jobs</span>
          </div>
          <h1>Crear cuenta</h1>
          <p className="auth-subtitle">Únete a la comunidad agrícola</p>
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
          {role === 'worker' ? (
            <>
              <div className="form-group">
                <label>Nombre completo</label>
                <div className="input-with-icon">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="Nombre Apellido"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="tu@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <div className="input-with-icon">
                  <span className="input-icon">📱</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="600 000 000"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <div className="input-with-icon">
                  <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => updateField('companyName', e.target.value)}
                    placeholder="Nombre de tu empresa"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email empresarial</label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="empresa@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>CIF</label>
                <div className="input-with-icon">
                  <span className="input-icon">📋</span>
                  <input
                    type="text"
                    value={formData.cif}
                    onChange={e => updateField('cif', e.target.value.toUpperCase())}
                    placeholder="A12345678"
                    maxLength={9}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Persona de contacto</label>
                <div className="input-with-icon">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => updateField('contactPerson', e.target.value)}
                    placeholder="Nombre completo"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Teléfono de empresa</label>
                <div className="input-with-icon">
                  <span className="input-icon">📱</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="900 000 000"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => updateField('password', e.target.value)}
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
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${passwordStrength.strength * 25}%`,
                      background: passwordStrength.color 
                    }}
                  />
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <span className="input-validation valid">✓</span>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="input-validation invalid">✗</span>
              )}
            </div>
          </div>

          <div className="form-group terms-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                Acepto los <Link to="#">términos y condiciones</Link> y la <Link to="#">política de privacidad</Link>
              </span>
            </label>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default Register