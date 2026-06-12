import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Loader, Camera, Calendar, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { uploadAvatar, updateAvatarInUser } from '../utils/authService'
import './AdminProfile.css'

function AdminProfile() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    if (!authUser) { navigate('/login'); return }
    if (authUser.role !== 'admin') { navigate('/profile'); return }
    setUser(authUser)
    setFormData({
      name: authUser.name || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      location: authUser.location || ''
    })
    if (authUser.avatar_url) {
      setAvatarPreview(authUser.avatar_url)
    }
  }, [authUser, navigate])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, avatar: 'Solo se permiten imágenes JPG, PNG o WebP' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, avatar: 'La imagen debe ser menor de 2MB' })
      return
    }

    setErrors({ ...errors, avatar: null })
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

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
        if (value && !/^\d{9}$/.test(value.replace(/\s/g, ''))) return 'El teléfono debe tener 9 dígitos'
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
    } else {
      processedValue = value
    }

    setFormData({ ...formData, [name]: processedValue })

    if (errors[name]) {
      const error = validateField(name, processedValue)
      setErrors({ ...errors, [name]: error })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const fieldsToValidate = ['name', 'email', 'phone']

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    try {
      let avatarUrl = user.avatar_url

      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile)
        await updateAvatarInUser(user.id, avatarUrl)
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        avatar_url: avatarUrl
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) throw updateError

      setUser({ ...user, ...updateData })
      setSaved(true)
      setAvatarFile(null)
      setAvatarPreview(avatarUrl)
      setLoading(false)
      setTimeout(() => {
        setSaved(false)
      }, 2000)
    } catch (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!user) return null

  return (
    <div className="admin-profile-page">
      <div className="admin-profile-container">
        <div className="admin-profile-header">
          <div className="admin-profile-avatar-wrapper">
            {avatarPreview || user.avatar_url ? (
              <img src={avatarPreview || user.avatar_url} alt="Avatar" className="admin-profile-avatar-image" />
            ) : (
              <div className="admin-profile-avatar-initial">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <label className="admin-avatar-upload-btn">
              <Camera size={16} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={loading}
              />
            </label>
          </div>
          {errors.avatar && <span className="admin-error-text">{errors.avatar}</span>}
          <div className="admin-profile-header-info">
            <h1>Mi perfil</h1>
            <div className="admin-profile-type-badge">
              <Settings size={16} /> Admin
            </div>
          </div>
        </div>

        {saved && <div className="admin-success-message">Cambios guardados correctamente</div>}

        <form onSubmit={handleSubmit} className="admin-profile-form">
          <div className="admin-form-section">
            <h3>Datos personales</h3>
            <div className="admin-form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="admin-error-text">{errors.name}</span>}
            </div>
            <div className="admin-form-group">
              <label>Ubicación</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Baena, Córdoba"
                disabled={loading}
              />
            </div>
          </div>

          <div className="admin-form-section">
            <h3>Contacto</h3>
            <div className="admin-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="admin-error-text">{errors.email}</span>}
            </div>
            <div className="admin-form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9 dígitos sin espacios"
                disabled={loading}
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="admin-error-text">{errors.phone}</span>}
            </div>
          </div>

          <div className="admin-form-section">
            <h3>Información de la cuenta</h3>
            <div className="admin-account-info">
              <div className="admin-account-row">
                <span className="admin-account-label">Rol</span>
                <span className="admin-account-value">
                  <Settings size={14} className="admin-account-icon" />
                  Administrador
                </span>
              </div>
              <div className="admin-account-row">
                <span className="admin-account-label">Registro</span>
                <span className="admin-account-value">
                  <Calendar size={14} className="admin-account-icon" />
                  {formatDate(user.created_at)}
                </span>
              </div>
              <div className="admin-account-row">
                <span className="admin-account-label">Último acceso</span>
                <span className="admin-account-value">
                  <Clock size={14} className="admin-account-icon" />
                  {formatDate(user.last_login)}
                </span>
              </div>
            </div>
          </div>

          <button type="submit" className="admin-btn-save" disabled={loading}>
            {loading ? <><Loader className="admin-spin" size={20} /> Guardando...</> : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminProfile
