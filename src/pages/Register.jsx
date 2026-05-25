import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Phone, Building2, FileText, Lock, Eye, EyeOff, Check, X, AlertCircle, Tractor } from 'lucide-react'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
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
  const [errors, setErrors] = useState({})
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

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
        if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(value)) return 'El nombre solo puede contener letras'
        return ''
      case 'email':
        if (!value) return 'El email es obligatorio'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato de email inválido'
        return ''
      case 'phone':
        if (!value) return 'El teléfono es obligatorio'
        if (!/^\d{9}$/.test(value)) return 'El teléfono debe tener exactamente 9 dígitos'
        return ''
      case 'password':
        if (!value) return 'La contraseña es obligatoria'
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
        return ''
      case 'confirmPassword':
        if (!value) return 'Debes confirmar la contraseña'
        if (value !== formData.password) return 'Las contraseñas no coinciden'
        return ''
      case 'companyName':
        if (!value || value.trim().length < 2) return 'El nombre de la empresa es obligatorio'
        return ''
      case 'cif':
        if (!value) return 'El CIF es obligatorio'
        if (!/^[A-Z0-9]{9}$/.test(value)) return 'El CIF debe tener 9 caracteres (letras y números)'
        return ''
      case 'contactPerson':
        if (!value || value.trim().length < 2) return 'La persona de contacto es obligatoria'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 9)
    } else if (name === 'cif') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9)
    } else if (name === 'name' || name === 'contactPerson') {
      processedValue = value.replace(/[^a-zA-Z\sáéíóúÁÉÍÓÚñÑ]/g, '')
    } else {
      processedValue = value
    }

    setFormData({ ...formData, [name]: processedValue })

    const error = validateField(name, processedValue)
    setErrors({ ...errors, [name]: error })
  }

  const validateForm = () => {
    const newErrors = {}
    const workerFields = ['name', 'email', 'phone', 'password', 'confirmPassword']
    const companyFields = ['companyName', 'email', 'cif', 'contactPerson', 'phone', 'password', 'confirmPassword']
    const fieldsToValidate = role === 'worker' ? workerFields : companyFields

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    if (!validateForm()) {
      setError('Por favor, corrige los errores antes de continuar')
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
          {role === 'worker' ? (
            <>
              <div className="form-group">
                <label>Nombre completo</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nombre Apellido"
                    disabled={loading}
                    className={errors.name ? 'input-error' : ''}
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    disabled={loading}
                    className={errors.email ? 'input-error' : ''}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9 dígitos (ej: 600123456)"
                    disabled={loading}
                    className={errors.phone ? 'input-error' : ''}
                  />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="input-icon" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Nombre de tu empresa"
                    disabled={loading}
                    className={errors.companyName ? 'input-error' : ''}
                  />
                </div>
                {errors.companyName && <span className="field-error">{errors.companyName}</span>}
              </div>

              <div className="form-group">
                <label>Email empresarial</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="empresa@email.com"
                    disabled={loading}
                    className={errors.email ? 'input-error' : ''}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>CIF</label>
                <div className="input-with-icon">
                  <FileText size={18} className="input-icon" />
                  <input
                    type="text"
                    name="cif"
                    value={formData.cif}
                    onChange={handleChange}
                    placeholder="A12345678"
                    maxLength={9}
                    disabled={loading}
                    className={errors.cif ? 'input-error' : ''}
                  />
                </div>
                {errors.cif && <span className="field-error">{errors.cif}</span>}
              </div>

              <div className="form-group">
                <label>Persona de contacto</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    disabled={loading}
                    className={errors.contactPerson ? 'input-error' : ''}
                  />
                </div>
                {errors.contactPerson && <span className="field-error">{errors.contactPerson}</span>}
              </div>

              <div className="form-group">
                <label>Teléfono de empresa</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9 dígitos (ej: 900123456)"
                    disabled={loading}
                    className={errors.phone ? 'input-error' : ''}
                  />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </>
          )}

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <span className="input-validation valid"><Check size={16} /></span>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="input-validation invalid"><X size={16} /></span>
              )}
            </div>
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
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