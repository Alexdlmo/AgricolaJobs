import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Wheat, Loader, Camera, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { uploadAvatar, updateAvatarInUser, getReviewsForUser, getUserAverageRating } from '../utils/authService'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    location: '',
    companyName: '',
    cif: '',
    contactPerson: ''
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [reviews, setReviews] = useState([])
  const [ratingData, setRatingData] = useState({ average: 0, count: 0 })

  useEffect(() => {
    if (!authUser) { navigate('/login'); return }
    setUser(authUser)
    setFormData({ 
      name: authUser.name || '', 
      email: authUser.email || '', 
      phone: authUser.phone || '',
      location: authUser.location || '',
      companyName: authUser.companyName || '',
      cif: authUser.cif || '',
      contactPerson: authUser.contact_person || ''
    })
    if (authUser.avatar_url) {
      setAvatarPreview(authUser.avatar_url)
    }

    const loadReviews = async () => {
      try {
        const userReviews = await getReviewsForUser(authUser.id)
        setReviews(userReviews)
        const rating = await getUserAverageRating(authUser.id)
        setRatingData(rating)
      } catch (error) {
        console.error('Error loading reviews:', error)
      }
    }
    loadReviews()
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
      case 'companyName':
        if (!value || value.trim().length < 2) return 'El nombre de la empresa es obligatorio'
        return ''
      case 'cif':
        if (value && value.length !== 9) return 'El CIF debe tener 9 caracteres'
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
    const fieldsToValidate = isCompany 
      ? ['companyName', 'email', 'phone', 'cif', 'contactPerson']
      : ['name', 'email', 'phone', 'location']
    
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
      if (user.role === 'company') {
        updateData.companyName = formData.companyName
        updateData.cif = formData.cif
        updateData.contact_person = formData.contactPerson
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

  if (!user) return null
  const isCompany = user.role === 'company'

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            {avatarPreview || user.avatar_url ? (
              <img src={avatarPreview || user.avatar_url} alt="Avatar" className="profile-avatar-image" />
            ) : (
              <div className="profile-avatar">{user.name ? user.name.charAt(0).toUpperCase() : '?'}</div>
            )}
            <label className="avatar-upload-btn">
              <Camera size={16} />
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={loading}
              />
            </label>
          </div>
          {errors.avatar && <span className="error-text">{errors.avatar}</span>}
          <div className="profile-header-info">
            <h1>Mi perfil</h1>
            <div className="profile-type-badge">
              {isCompany ? <><Building2 size={16} /> Empresa</> : <><Wheat size={16} /> Trabajador</>}
            </div>
          </div>
        </div>
        
        {saved && <div className="success-message">✓ Cambios guardados correctamente</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          {!isCompany && (
            <div className="form-section">
              <h3>Datos personales</h3>
              <div className="form-group">
                <label>Nombre completo</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location} 
                  onChange={handleChange}
                  placeholder="Ej: Córdoba, Sevilla"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Contacto</h3>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange}
                disabled={loading}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            <div className="form-group">
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
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>

          {isCompany && (
            <div className="form-section">
              <h3>Datos de empresa</h3>
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <input 
                  type="text" 
                  name="companyName"
                  value={formData.companyName} 
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.companyName ? 'input-error' : ''}
                />
                {errors.companyName && <span className="error-text">{errors.companyName}</span>}
              </div>
              <div className="form-group">
                <label>CIF</label>
                <input 
                  type="text" 
                  name="cif"
                  value={formData.cif} 
                  onChange={handleChange}
                  maxLength={9}
                  placeholder="A12345678"
                  disabled={loading}
                  className={errors.cif ? 'input-error' : ''}
                />
                {errors.cif && <span className="error-text">{errors.cif}</span>}
              </div>
              <div className="form-group">
                <label>Persona de contacto</label>
                <input 
                  type="text" 
                  name="contactPerson"
                  value={formData.contactPerson} 
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.contactPerson ? 'input-error' : ''}
                />
                {errors.contactPerson && <span className="error-text">{errors.contactPerson}</span>}
              </div>
            </div>
          )}

          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? <><Loader className="spin" size={20} /> Guardando...</> : 'Guardar cambios'}
          </button>
        </form>

        {ratingData.count > 0 && (
          <div className="profile-reviews-section">
            <h3>Valoraciones recibidas</h3>
            <div className="rating-summary">
              <div className="rating-average">
                <Star size={24} fill="#fbbf24" color="#fbbf24" />
                <span className="rating-number">{ratingData.average}</span>
                <span className="rating-count">({ratingData.count} reseñas)</span>
              </div>
            </div>
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={16} 
                          fill={star <= review.rating ? '#fbbf24' : 'none'} 
                          color={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                        />
                      ))}
                    </div>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                  <div className="reviewer-info">
                    <span>Valorado por: {review.reviewer?.name || 'Usuario'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default Profile