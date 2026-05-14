import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'
function Profile() {
  const navigate = useNavigate()
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
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('agricolaJobsSession'))
    if (!u) { navigate('/login'); return }
    setUser(u)
    setFormData({ 
      name: u.name || '', 
      email: u.email || '', 
      phone: u.phone || '',
      location: u.location || '',
      companyName: u.companyName || '',
      cif: u.cif || '',
      contactPerson: u.contact_person || ''
    })
  }, [])
  const handleSubmit = (e) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('agricolaJobsUsers') || '[]')
    const idx = users.findIndex(u => u.id === user.id)
    if (idx !== -1) users[idx] = { ...users[idx], ...formData, contact_person: formData.contactPerson }
    localStorage.setItem('agricolaJobsUsers', JSON.stringify(users))
    localStorage.setItem('agricolaJobsSession', JSON.stringify({ ...user, ...formData, contact_person: formData.contactPerson, location: formData.location }))
    setUser({ ...user, ...formData, location: formData.location })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      navigate('/dashboard')
    }, 1500)
  }
  if (!user) return null
  const isCompany = user.userType === 'company'
  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Mi perfil</h1>
        <div className="profile-type-badge">{isCompany ? '🏢 Empresa' : '🌾 Trabajador'}</div>
        {saved && <div className="success-message">✓ Cambios guardados</div>}
        <form onSubmit={handleSubmit} className="profile-form">
          {isCompany ? (
            <>
              <div className="form-group"><label>Nombre de la empresa</label><input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="form-group"><label>Teléfono</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>CIF</label><input type="text" value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value.toUpperCase()})} maxLength={9} /></div>
              <div className="form-group"><label>Persona de contacto</label><input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} /></div>
            </>
          ) : (
            <>
              <div className="form-group"><label>Nombre</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="form-group"><label>Teléfono</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Ubicación</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej: Córdoba, Sevilla" /></div>
            </>
          )}
          <button type="submit" className="btn-save">Guardar cambios</button>
        </form>
      </div>
    </div>
  )
}
export default Profile