import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSession, logout, getAllOffers, getOffersByCompany, createOffer, createNotification, getNotifications, markNotificationAsRead, deleteOffer, deleteNotification, deleteAllNotifications } from '../utils/authService'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [offers, setOffers] = useState([])
  const [userOffers, setUserOffers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ title: '', location: '', salary: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [offerApplicants, setOfferApplicants] = useState({})
  const [expandedOffers, setExpandedOffers] = useState({})
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/login')
      return
    }
    
    if (session.role === 'admin') {
      navigate('/admin')
      return
    }
    
    setUser(session)
    loadData(session)
  }, [navigate])

  const loadData = async (session) => {
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      setOffers(allOffers)

      const userNotifications = await getNotifications(session.id)
      setNotifications(userNotifications || [])

      if (session.role === 'company') {
        const companyOffers = await getOffersByCompany(session.id)
        setUserOffers(companyOffers)
        
        const offerIds = companyOffers.map(o => o.id)
        if (offerIds.length > 0) {
          const { supabase } = await import('../utils/supabaseClient')
          const { data: applications, error: appError } = await supabase
            .from('applications')
            .select('*, worker:users(id, name, phone, email)')
            .in('offer_id', offerIds)
            .order('applied_at', { ascending: false })
          
          if (!appError && applications) {
            const applicantsByOffer = {}
            applications.forEach(app => {
              if (!applicantsByOffer[app.offer_id]) {
                applicantsByOffer[app.offer_id] = []
              }
              applicantsByOffer[app.offer_id].push({
                id: app.id,
                workerId: app.worker.id,
                workerName: app.worker.name,
                workerPhone: app.worker.phone,
                workerEmail: app.worker.email,
                status: app.status,
                appliedAt: app.applied_at
              })
            })
            setOfferApplicants(applicantsByOffer)
          }
        }
      } else {
        const { supabase } = await import('../utils/supabaseClient')
        const { data: applications } = await supabase
          .from('applications')
          .select('offer_id, status')
          .eq('worker_id', session.id)
        
        const applicationsWithStatus = {}
        applications?.forEach(app => {
          applicationsWithStatus[app.offer_id] = app.status
        })
        
        setUserOffers(allOffers.map(offer => ({
          ...offer,
          applicationStatus: applicationsWithStatus[offer.id] || 'pending'
        })))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user || user.role !== 'company') return

    setSubmitting(true)
    try {
      const newOffer = {
        company_id: user.id,
        title: formData.title,
        location: formData.location,
        salary: formData.salary,
        description: formData.description,
        status: 'active'
      }
      await createOffer(newOffer)
      const companyOffers = await getOffersByCompany(user.id)
      setUserOffers(companyOffers)
      setActiveTab('offers')
      setFormData({ title: '', location: '', salary: '', description: '' })
      alert('Oferta publicada correctamente')
    } catch (error) {
      alert('Error al publicar oferta: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { supabase } = await import('../utils/supabaseClient')
      
      const { data: app, error: appError } = await supabase
        .from('applications')
        .select('offer_id, worker_id')
        .eq('id', applicationId)
        .single()
      
      if (appError) {
        console.error('Error fetching application:', appError)
        throw new Error('No se encontró la solicitud')
      }
      
      if (!app) {
        throw new Error('No se encontró la solicitud')
      }
      
      const workerId = app.worker_id
      const offerId = app.offer_id
      
      const { data: workerData } = await supabase
        .from('users')
        .select('name')
        .eq('id', workerId)
        .single()
      
      const { data: offerData } = await supabase
        .from('offers')
        .select('title, company_id')
        .eq('id', offerId)
        .single()
      
      const workerName = workerData?.name || 'trabajador'
      const offerTitle = offerData?.title || 'la oferta'
      
      let companyName = 'la empresa'
      if (offerData?.company_id) {
        const { data: companyData } = await supabase
          .from('users')
          .select('name')
          .eq('id', offerData.company_id)
          .single()
        companyName = companyData?.name || 'la empresa'
      }
      
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)
      
      if (error) throw error
      
      console.log('Creating notification for worker:', workerId, 'offer:', offerTitle, 'company:', companyName)
      
      if (newStatus === 'accepted' && workerId) {
        await createNotification(
          workerId,
          '¡Has sido aceptado!',
          `${companyName} te ha aceptado para el puesto de ${offerTitle}`,
          'application_accepted'
        )
      } else if (newStatus === 'rejected' && workerId) {
        await createNotification(
          workerId,
          'Solicitud actualizada',
          `${companyName} ha revisado tu solicitud para ${offerTitle}`,
          'application_rejected'
        )
      }
      
      setOfferApplicants(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(offerId => {
          updated[offerId] = updated[offerId].map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        })
        return updated
      })
      
      alert(newStatus === 'accepted' ? 'Interesado aceptado' : 'Interesado rechazado')
    } catch (error) {
      alert('Error al actualizar: ' + error.message)
    }
  }

  const toggleExpandOffer = (offerId) => {
    setExpandedOffers(prev => ({ ...prev, [offerId]: !prev[offerId] }))
  }

  const getTotalApplicants = () => {
    return Object.values(offerApplicants).flat().length
  }

  const handleDeleteOffer = async (offerId, offerTitle) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la oferta "${offerTitle}"? Esta acción no se puede deshacer.`)) {
      return
    }
    
    try {
      await deleteOffer(offerId)
      const companyOffers = await getOffersByCompany(user.id)
      setUserOffers(companyOffers)
      setOffers(await getAllOffers())
      alert('Oferta eliminada correctamente')
    } catch (error) {
      alert('Error al eliminar oferta: ' + error.message)
    }
  }

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      alert('Error al eliminar notificación')
    }
  }

  const handleDeleteAllNotifications = async () => {
    if (notifications.length === 0) return
    if (!confirm('¿Eliminar todas las notificaciones?')) return
    try {
      await deleteAllNotifications(user.id)
      setNotifications([])
    } catch (error) {
      alert('Error al eliminar notificaciones')
    }
  }

  if (!user) return null

  const isCompany = user.role === 'company'

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Bienvenido, {user.name}</h1>
          <p>{isCompany ? 'Gestiona tus ofertas de trabajo' : 'Encuentra tu próximo trabajo agrícola'}</p>
        </div>

        {isCompany ? (
          <div className="company-dashboard">
            <div className="dashboard-nav">
              <button 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Resumen
              </button>
              <button 
                className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
                onClick={() => setActiveTab('offers')}
              >
                📋 Mis ofertas
              </button>
              <button 
                className={`nav-item ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                ➕ Publicar
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <span className="stat-number">{userOffers.length}</span>
                    <span className="stat-label">Ofertas publicadas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👁️</div>
                  <div className="stat-info">
                    <span className="stat-number">{offers.length}</span>
                    <span className="stat-label">Total ofertas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <span className="stat-number">{getTotalApplicants()}</span>
                    <span className="stat-label">interesados</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="section-card">
                <h2>Mis ofertas publicadas</h2>
                {userOffers.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <p>No tienes ofertas publicadas</p>
                    <button className="btn-primary" onClick={() => setActiveTab('create')}>
                      Publicar primera oferta
                    </button>
                  </div>
                ) : (
                  <div className="offers-list">
                    {userOffers.map(offer => {
                      const applicants = offerApplicants[offer.id] || []
                      const isExpanded = expandedOffers[offer.id]
                      return (
                        <div key={offer.id} className="offer-item">
                          <div className="offer-header" onClick={() => toggleExpandOffer(offer.id)} style={{cursor: 'pointer'}}>
                            <div className="offer-info">
                              <h3>{offer.title}</h3>
                              <p>{offer.location} | {offer.salary}€</p>
                            </div>
                            <div className="offer-right">
                              <span className="applicants-count">{applicants.length} interesados</span>
                              <span className="offer-status">
                                  {offer.status === 'active' ? 'Activa' : 
                                   offer.status === 'inactive' ? 'Inactiva' : 'Activa'}
                                </span>
                              <button 
                                className="btn-delete-offer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteOffer(offer.id, offer.title)
                                }}
                                title="Eliminar oferta"
                              >
                                🗑️
                              </button>
                              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="offer-applicants">
                              {applicants.length === 0 ? (
                                <p className="no-applicants">Aún no hay interesados</p>
                              ) : (
                                <div className="applicants-grid">
                                  {applicants.map(app => (
                                    <div key={app.id} className="applicant-card">
                                      <div className="applicant-details">
                                        <h4>{app.workerName}</h4>
                                        <p>📞 {app.workerPhone}</p>
                                        <p>✉️ {app.workerEmail}</p>
                                        <p className="applied-date">
                                          {new Date(app.appliedAt).toLocaleDateString('es-ES')}
                                        </p>
                                      </div>
                                      <div className="applicant-actions">
                                        {app.status === 'pending' && (
                                          <>
                                            <button 
                                              className="btn-accept"
                                              onClick={() => handleApplicationStatus(app.id, 'accepted')}
                                            >
                                              ✓ Aceptar
                                            </button>
                                            <button 
                                              className="btn-reject"
                                              onClick={() => handleApplicationStatus(app.id, 'rejected')}
                                            >
                                              ✗ Rechazar
                                            </button>
                                          </>
                                        )}
                                        <span className={`status-badge ${app.status}`}>
                                          {app.status === 'pending' ? 'Pendiente' : 
                                           app.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="section-card">
                <h2>Publicar nueva oferta</h2>
                <form className="offer-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Título del puesto</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Tractista"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ubicación</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Sevilla"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Salario (€/día)</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 60"
                        value={formData.salary}
                        onChange={e => setFormData({...formData, salary: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea 
                      placeholder="Describe las funciones del puesto..." 
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Publicando...' : 'Publicar oferta'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="worker-dashboard">
            <div className="dashboard-nav">
              <button 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                🔍 Buscar empleo
              </button>
              <button 
                className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                📄 Mis solicitudes
              </button>
              <button 
                className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                🔔 Notificaciones {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
              </button>
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 Mi perfil
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="section-card">
                <h2>Ofertas disponibles</h2>
                {offers.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🌾</span>
                    <p>No hay ofertas disponibles en este momento</p>
                    <p className="empty-subtitle">Vuelve más tarde</p>
                  </div>
                ) : (
                  <div className="offers-grid">
                    {offers.map(offer => (
                      <div key={offer.id} className="offer-card">
                        <h3>{offer.title}</h3>
                        <p className="offer-location">📍 {offer.location}</p>
                        <p className="offer-salary">💰 {offer.salary}€</p>
                        <p className="offer-description">{offer.description?.substring(0, 100)}...</p>
                        <button className="btn-secondary" onClick={() => navigate(`/offer/${offer.id}`)}>Ver detalles</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="section-card">
                <h2>Mis solicitudes</h2>
                {userOffers.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📄</span>
                    <p>No has solicitado ninguna oferta</p>
                    <Link to="/offers" className="btn-primary">
                      Ver ofertas disponibles
                    </Link>
                  </div>
                ) : (
                  <div className="applications-list">
                    {userOffers.map(offer => {
                      const status = offer.applicationStatus || 'pending'
                      return (
                        <div key={offer.id} className="application-item">
                          <div className="application-info">
                            <h3>{offer.title}</h3>
                            <p>{offer.location}</p>
                          </div>
                          <span className={`application-status ${status}`}>
                            {status === 'pending' ? 'En revisión' : 
                             status === 'accepted' ? 'Aceptado' : 
                             status === 'rejected' ? 'Rechazado' : 'En revisión'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && !isCompany && (
              <div className="section-card">
                <div className="notifications-header">
                  <h2>Mis notificaciones</h2>
                  {notifications.length > 0 && (
                    <button className="btn-delete-all" onClick={handleDeleteAllNotifications}>
                      Vaciar todas
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🔔</span>
                    <p>No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                        onClick={async () => {
                          if (!notif.read) {
                            await markNotificationAsRead(notif.id)
                            setNotifications(prev => prev.map(n => 
                              n.id === notif.id ? { ...n, read: true } : n
                            ))
                          }
                        }}
                      >
                        <div className="notification-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                          <span className="notification-date">
                            {new Date(notif.created_at + 'Z').toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="notification-actions">
                          {!notif.read && <span className="notification-dot"></span>}
                          <button 
                            className="btn-delete-notif"
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="section-card">
                <h2>Mi perfil</h2>
                <div className="profile-info">
                  <div className="profile-avatar">👨‍🌾</div>
                  <div className="profile-details">
                    <div className="profile-field">
                      <span className="field-label">Nombre</span>
                      <span className="field-value">{user.name}</span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Email</span>
                      <span className="field-value">{user.email}</span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Teléfono</span>
                      <span className="field-value">{user.phone || 'No añadido'}</span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Ubicación</span>
                      <span className="field-value">{user.location || 'No añadida'}</span>
                    </div>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/profile')}>Editar perfil</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard