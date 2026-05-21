import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllOffers, getOffersByCompany, createOffer, createNotification, getNotifications, markNotificationAsRead, deleteOffer, deleteNotification, deleteAllNotifications, createReview, createConversation, getConversations, getMessages, sendMessage, markMessagesAsRead } from '../utils/authService'
import { supabase } from '../utils/supabaseClient'
import { BarChart3, FileText, Plus, Eye, CheckCircle, User, Wheat, MapPin, DollarSign, Search, Bell, ClipboardList, Trash2, ChevronDown, ChevronRight, Phone, Mail, Star, X, MessageCircle, Send } from 'lucide-react'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [offers, setOffers] = useState([])
  const [userOffers, setUserOffers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ title: '', location: '', salary: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [offerApplicants, setOfferApplicants] = useState({})
  const [expandedOffers, setExpandedOffers] = useState({})
  const [notifications, setNotifications] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' })
  const [reviewTarget, setReviewTarget] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [toast, setToast] = useState(null)
  const [unreadCounts, setUnreadCounts] = useState({})

  const loadData = async (session) => {
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      setOffers(allOffers)

      const userNotifications = await getNotifications(session.id)
      setNotifications(userNotifications || [])

      const userConversations = await getConversations(session.id)
      setConversations(userConversations || [])

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
        
        const appliedOffers = allOffers.filter(offer => applicationsWithStatus[offer.id])
        const offersWithStatus = appliedOffers.map(offer => ({
          ...offer,
          applicationStatus: applicationsWithStatus[offer.id]
        }))
        setUserOffers(offersWithStatus)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (user?.role === 'admin') {
      navigate('/admin')
      return
    }
    
    loadData(user)
  }, [navigate, isAuthenticated, user])

  const loadUnreadCounts = async () => {
    if (!user) return
    try {
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('read', false)
        .neq('sender_id', user.id)

      const counts = {}
      unreadMessages?.forEach(msg => {
        counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1
      })
      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error loading unread counts:', error)
    }
  }

  const loadMessages = async (conversation) => {
    try {
      const msgs = await getMessages(conversation.id)
      setMessages(msgs || [])
      setSelectedConversation(conversation)
      await markMessagesAsRead(conversation.id, user.id)
      setUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 }))
    } catch (error) {
      console.error('Error loading messages:', error)
      alert('Error al cargar los mensajes')
    }
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (user && conversations.length > 0) {
      loadUnreadCounts()
    }
  }, [user, conversations])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMessage = payload.new
        
        const isRelevant = conversations.some(c => 
          c.id === newMessage.conversation_id && 
          (c.company_id === user.id || c.worker_id === user.id)
        )

        if (isRelevant && newMessage.sender_id !== user.id) {
          showToast('Nuevo mensaje recibido')
          
          if (selectedConversation?.id === newMessage.conversation_id) {
            loadMessages(selectedConversation)
          } else {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.conversation_id]: (prev[newMessage.conversation_id] || 0) + 1
            }))
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, conversations, selectedConversation])

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'messages' && selectedConversation) {
        loadMessages(selectedConversation)
      }
      if (activeTab === 'messages') {
        loadData(user)
        loadUnreadCounts()
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [activeTab, selectedConversation, user])

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
        
        if (offerData?.company_id) {
          try {
            await createConversation(offerId, offerData.company_id, workerId)
          } catch (convError) {
            console.error('Error creating conversation:', convError)
          }
        }
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

  const openReviewModal = (applicant, offer) => {
    setReviewTarget({
      applicant,
      offer,
      reviewed_id: applicant.workerId,
      offer_id: offer.id
    })
    setReviewData({ rating: 0, comment: '' })
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      alert('Por favor selecciona una puntuación')
      return
    }

    try {
      await createReview({
        reviewer_id: user.id,
        reviewed_id: reviewTarget.reviewed_id,
        offer_id: reviewTarget.offer_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewer_role: user.role
      })

      setShowReviewModal(false)
      alert('¡Gracias por tu valoración!')
    } catch (error) {
      alert('Error al enviar la valoración: ' + error.message)
    }
  }

  const openWorkerReviewModal = (offer) => {
    setReviewTarget({
      offer,
      reviewed_id: offer.company_id,
      offer_id: offer.id
    })
    setReviewData({ rating: 0, comment: '' })
    setShowReviewModal(true)
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      await sendMessage(selectedConversation.id, user.id, newMessage)
      setNewMessage('')
      await loadMessages(selectedConversation)
      const updatedConversations = await getConversations(user.id)
      setConversations(updatedConversations || [])
    } catch (error) {
      alert('Error al enviar mensaje: ' + error.message)
    } finally {
      setSendingMessage(false)
    }
  }

  if (!user) return null

  const isCompany = user.role === 'company'

  return (
    <div className="dashboard-page">
      {toast && (
        <div className="toast-notification">
          <MessageCircle size={18} />
          <span>{toast}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
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
                <BarChart3 size={18} /> Resumen
              </button>
              <button 
                className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
                onClick={() => setActiveTab('offers')}
              >
                <FileText size={18} /> Mis ofertas
              </button>
              <button 
                className={`nav-item ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <Plus size={18} /> Publicar
              </button>
              <button 
                className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                <MessageCircle size={18} /> Mensajes
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-icon"><FileText size={24} /></div>
                  <div className="stat-info">
                    <span className="stat-number">{userOffers.length}</span>
                    <span className="stat-label">Ofertas publicadas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><Eye size={24} /></div>
                  <div className="stat-info">
                    <span className="stat-number">{offers.length}</span>
                    <span className="stat-label">Total ofertas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><CheckCircle size={24} /></div>
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
                    <span className="empty-icon"><FileText size={48} /></span>
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
                                <Trash2 size={18} />
                              </button>
                              <span className="expand-icon">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
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
                                        <p><Phone size={16} /> {app.workerPhone}</p>
                                        <p><Mail size={16} /> {app.workerEmail}</p>
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
                                        {(app.status === 'accepted' || app.status === 'rejected') && user.role === 'company' && (
                                          <button 
                                            className="btn-review"
                                            onClick={() => openReviewModal(app, offer)}
                                          >
                                            <Star size={14} /> Valorar
                                          </button>
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

            {activeTab === 'messages' && (
              <div className="chat-container">
                <div className="conversations-list">
                  <h2>Conversaciones</h2>
                  {conversations.length === 0 ? (
                    <div className="empty-state">
                      <MessageCircle size={48} />
                      <p>No tienes conversaciones</p>
                      <p className="empty-subtitle">Las conversaciones se crean cuando aceptas a un trabajador</p>
                    </div>
                  ) : (
                    <div className="conversations-items">
                      {conversations.map(conv => {
                        const otherUser = isCompany ? conv.worker : conv.company
                        const offerTitle = conv.offer?.title || 'Oferta'
                        const unread = unreadCounts[conv.id] || 0
                        return (
                          <div 
                            key={conv.id} 
                            className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${unread > 0 ? 'unread' : ''}`}
                            onClick={() => {
                              loadMessages(conv)
                              setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }))
                            }}
                          >
                            <div className="conversation-avatar">
                              {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt={otherUser.name} />
                              ) : (
                                <User size={24} />
                              )}
                            </div>
                            <div className="conversation-info">
                              <span className="conversation-name">{otherUser?.name || 'Usuario'}</span>
                              <span className="conversation-offer">{offerTitle}</span>
                            </div>
                            {unread > 0 && (
                              <span className="unread-badge">{unread}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="chat-view">
                  {selectedConversation ? (
                    <>
                      <div className="chat-header">
                        <span className="chat-with">
                          {isCompany ? selectedConversation.worker?.name : selectedConversation.company?.name}
                        </span>
                        <span className="chat-offer-title">
                          {selectedConversation.offer?.title}
                        </span>
                      </div>
                      <div className="messages-list">
                        {messages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                          >
                            <div className="message-content">
                              <p>{msg.content}</p>
                              <span className="message-time">
                                {new Date(msg.created_at + 'Z').toLocaleString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form className="message-input-form" onSubmit={handleSendMessage}>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          disabled={sendingMessage}
                        />
                        <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                          <Send size={20} />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="no-conversation-selected">
                      <MessageCircle size={64} />
                      <p>Selecciona una conversación para ver los mensajes</p>
                    </div>
                  )}
                </div>
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
                <Search size={18} /> Buscar empleo
              </button>
              <button 
                className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                <ClipboardList size={18} /> Mis solicitudes
              </button>
              <button 
                className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} /> Notificaciones {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
              </button>
              <button 
                className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                <MessageCircle size={18} /> Mensajes
              </button>
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> Mi perfil
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="section-card">
                <h2>Ofertas disponibles</h2>
                {offers.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon"><Wheat size={48} /></span>
                    <p>No hay ofertas disponibles en este momento</p>
                    <p className="empty-subtitle">Vuelve más tarde</p>
                  </div>
                ) : (
                  <div className="offers-grid">
                    {offers.map(offer => (
                      <div key={offer.id} className="offer-card">
                        <h3>{offer.title}</h3>
                        <p className="offer-location"><MapPin size={14} /> {offer.location}</p>
                        <p className="offer-salary"><DollarSign size={14} /> {offer.salary}€</p>
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
                    <span className="empty-icon"><FileText size={48} /></span>
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
<div className="application-actions">
                              <span className={`application-status ${status}`}>
                                {status === 'pending' ? 'En revisión' : 
                                 status === 'accepted' ? 'Aceptado' : 
                                 status === 'rejected' ? 'Rechazado' : 'En revisión'}
                              </span>
                              {status === 'accepted' && user.role === 'worker' && (
                                <button 
                                  className="btn-review"
                                  onClick={() => openWorkerReviewModal(offer)}
                                >
                                  <Star size={14} /> Valorar empresa
                                </button>
                              )}
                            </div>
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
                    <span className="empty-icon"><Bell size={48} /></span>
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
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="chat-container">
                <div className="conversations-list">
                  <h2>Conversaciones</h2>
                  {conversations.length === 0 ? (
                    <div className="empty-state">
                      <MessageCircle size={48} />
                      <p>No tienes conversaciones</p>
                      <p className="empty-subtitle">Las conversaciones se crean cuando aplicas a una oferta</p>
                    </div>
                  ) : (
                    <div className="conversations-items">
                      {conversations.map(conv => {
                        const otherUser = isCompany ? conv.worker : conv.company
                        const offerTitle = conv.offer?.title || 'Oferta'
                        const unread = unreadCounts[conv.id] || 0
                        return (
                          <div 
                            key={conv.id} 
                            className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${unread > 0 ? 'unread' : ''}`}
                            onClick={() => {
                              loadMessages(conv)
                              setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }))
                            }}
                          >
                            <div className="conversation-avatar">
                              {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt={otherUser.name} />
                              ) : (
                                <User size={24} />
                              )}
                            </div>
                            <div className="conversation-info">
                              <span className="conversation-name">{otherUser?.name || 'Usuario'}</span>
                              <span className="conversation-offer">{offerTitle}</span>
                            </div>
                            {unread > 0 && (
                              <span className="unread-badge">{unread}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="chat-view">
                  {selectedConversation ? (
                    <>
                      <div className="chat-header">
                        <span className="chat-with">
                          {isCompany ? selectedConversation.worker?.name : selectedConversation.company?.name}
                        </span>
                        <span className="chat-offer-title">
                          {selectedConversation.offer?.title}
                        </span>
                      </div>
                      <div className="messages-list">
                        {messages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                          >
                            <div className="message-content">
                              <p>{msg.content}</p>
                              <span className="message-time">
                                {new Date(msg.created_at + 'Z').toLocaleString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form className="message-input-form" onSubmit={handleSendMessage}>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          disabled={sendingMessage}
                        />
                        <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                          <Send size={20} />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="no-conversation-selected">
                      <MessageCircle size={64} />
                      <p>Selecciona una conversación para ver los mensajes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="section-card">
                <h2>Mi perfil</h2>
                <div className="profile-info">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="dashboard-avatar-image" />
                  ) : (
                    <div className="profile-avatar"><User size={40} /></div>
                  )}
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

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Valorar {reviewTarget?.applicant ? 'trabajador' : 'empresa'}</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={`star ${reviewData.rating >= star ? 'filled' : ''}`}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                  >
                    <Star size={32} fill={reviewData.rating >= star ? '#fbbf24' : 'none'} />
                  </button>
                ))}
              </div>
              
              <p className="rating-label">
                {reviewData.rating === 0 ? 'Selecciona una puntuación' : 
                 reviewData.rating === 1 ? 'Muy mal' :
                 reviewData.rating === 2 ? 'Mal' :
                 reviewData.rating === 3 ? 'Regular' :
                 reviewData.rating === 4 ? 'Bien' : 'Excelente'}
              </p>
              
              <div className="form-group">
                <label>Comentario (opcional)</label>
                <textarea
                  value={reviewData.comment}
                  onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="Escribe tu experiencia con esta persona..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>
                Cancelar
              </button>
              <button className="btn-submit" onClick={handleSubmitReview}>
                Enviar valoración
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Dashboard