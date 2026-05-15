import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, logout, getAllUsers, deleteUser, getAllOffers, deleteOffer, updateOfferStatus, isAdmin, createOffer } from '../utils/authService'
import { getDashboardStats } from '../utils/apiService'
import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('stats')
  const [users, setUsers] = useState([])
  const [offers, setOffers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerFormData, setOfferFormData] = useState({ title: '', description: '', location: '', salary: '' })
  const [pythonStats, setPythonStats] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const allUsers = await getAllUsers()
      const allOffers = await getAllOffers()
      setUsers(allUsers)
      setOffers(allOffers)

      const stats = await getDashboardStats()
      if (stats && !stats.error) {
        setPythonStats(stats)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/login')
      return
    }
    const session = getSession()
    setUser(session)
    loadData()
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteUser = async (userId) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteUser(userId)
        await loadData()
      } catch (error) {
        alert('Error al eliminar usuario: ' + error.message)
      }
    }
  }

  const handleDeleteOffer = async (offerId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      try {
        await deleteOffer(offerId)
        await loadData()
      } catch (error) {
        alert('Error al eliminar oferta: ' + error.message)
      }
    }
  }

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      await updateOfferStatus(offerId, newStatus)
      await loadData()
    } catch (error) {
      alert('Error al actualizar estado: ' + error.message)
    }
  }

  const handleCreateOffer = async (e) => {
    e.preventDefault()
    try {
      await createOffer({
        ...offerFormData,
        salary: offerFormData.salary || '1500',
        status: 'active'
      })
      setShowOfferForm(false)
      setOfferFormData({ title: '', description: '', location: '', salary: '' })
      await loadData()
      alert('¡Oferta creada correctamente!')
    } catch (error) {
      alert('Error al crear oferta: ' + error.message)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(u => {
    if (searchTerm === 'worker') return u.role === 'worker'
    if (searchTerm === 'company') return u.role === 'company'
    if (searchTerm === 'admin') return u.role === 'admin'
    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredOffers = offers.filter(o => {
    if (searchTerm === 'active') return o.status === 'active'
    if (searchTerm === 'inactive') return o.status === 'inactive'
    return o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.companyName && o.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const stats = {
    totalUsers: users.length,
    workers: users.filter(u => u.role === 'worker').length,
    companies: users.filter(u => u.role === 'company').length,
    totalOffers: offers.length,
    activeOffers: offers.filter(o => o.status === 'active').length,
    inactiveOffers: offers.filter(o => o.status === 'inactive').length
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'worker': return '👨‍🌾 Trabajador'
      case 'company': return '🏢 Empresa'
      case 'admin': return '⚙️ Admin'
      default: return role
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'worker': return 'badge-worker'
      case 'company': return 'badge-company'
      case 'admin': return 'badge-admin'
      default: return ''
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-brand">
          <span className="brand-icon">⚙️</span>
          <span className="brand-name">Panel de Administración</span>
        </div>
        <div className="admin-user">
          <span className="user-name">Admin</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Estadísticas
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuarios ({stats.totalUsers})
          </button>
          <button
            className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            📋 Ofertas ({stats.totalOffers})
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="stats-grid">
            {pythonStats && (
              <div className="stat-card python-stat clickable" onClick={() => setActiveTab('users')}>
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-number">{pythonStats.total_users || 0}</span>
                  <span className="stat-label">Usuarios (Python API)</span>
                </div>
              </div>
            )}
            <div className="stat-card clickable" onClick={() => { setActiveTab('users'); setSearchTerm('worker'); }}>
              <div className="stat-icon">👨‍🌾</div>
              <div className="stat-info">
                <span className="stat-number">{stats.workers}</span>
                <span className="stat-label">Trabajadores</span>
              </div>
            </div>
            <div className="stat-card clickable" onClick={() => { setActiveTab('users'); setSearchTerm('company'); }}>
              <div className="stat-icon">🏢</div>
              <div className="stat-info">
                <span className="stat-number">{stats.companies}</span>
                <span className="stat-label">Empresas</span>
              </div>
            </div>
            {pythonStats && (
              <div className="stat-card python-stat clickable" onClick={() => setActiveTab('offers')}>
                <div className="stat-icon">🐍</div>
                <div className="stat-info">
                  <span className="stat-number">{pythonStats.total_offers || 0}</span>
                  <span className="stat-label">Ofertas (Python API)</span>
                </div>
              </div>
            )}
            <div className="stat-card clickable" onClick={() => { setActiveTab('offers'); setSearchTerm('active'); }}>
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-number">{stats.activeOffers}</span>
                <span className="stat-label">Ofertas Activas</span>
              </div>
            </div>
            <div className="stat-card clickable" onClick={() => { setActiveTab('offers'); setSearchTerm('inactive'); }}>
              <div className="stat-icon">⏸️</div>
              <div className="stat-info">
                <span className="stat-number">{stats.inactiveOffers}</span>
                <span className="stat-label">Ofertas Inactivas</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Gestión de Usuarios</h2>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Teléfono</th>
                    <th>Registrado</th>
                    <th>Último acceso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>{formatDate(u.lastLogin)}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.role === 'admin'}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="empty-state">
                  <p>No se encontraron usuarios</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Gestión de Ofertas</h2>
              <button 
                className="btn-primary" 
                onClick={() => setShowOfferForm(!showOfferForm)}
              >
                {showOfferForm ? '✕ Cancelar' : '+ Nueva Oferta'}
              </button>
            </div>
            
            {showOfferForm && (
              <div className="offer-form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f9faf9', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#2d5016' }}>Crear Nueva Oferta</h3>
                <form onSubmit={handleCreateOffer}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label>Título del puesto</label>
                      <input
                        type="text"
                        value={offerFormData.title}
                        onChange={(e) => setOfferFormData({...offerFormData, title: e.target.value})}
                        placeholder="Ej: Recolector de oliva"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Ubicación</label>
                      <input
                        type="text"
                        value={offerFormData.location}
                        onChange={(e) => setOfferFormData({...offerFormData, location: e.target.value})}
                        placeholder="Ej: Jaén, Andalucía"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Salario (€/mes)</label>
                      <input
                        type="text"
                        value={offerFormData.salary}
                        onChange={(e) => setOfferFormData({...offerFormData, salary: e.target.value})}
                        placeholder="Ej: 1500"
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Descripción</label>
                    <textarea
                      value={offerFormData.description}
                      onChange={(e) => setOfferFormData({...offerFormData, description: e.target.value})}
                      placeholder="Descripción del puesto y funciones..."
                      rows={4}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">Crear Oferta</button>
                </form>
              </div>
            )}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Empresa</th>
                    <th>Ubicación</th>
                    <th>Salario</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map(o => (
                    <tr key={o.id}>
                      <td>{o.title}</td>
                      <td>{o.companyName || 'N/A'}</td>
                      <td>{o.location || '-'}</td>
                      <td>{o.salary || '-'}</td>
                      <td>
                        <select
                          className={`status-select ${o.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          value={o.status || 'active'}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="active">Activa</option>
                          <option value="inactive">Inactiva</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteOffer(o.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOffers.length === 0 && (
                <div className="empty-state">
                  <p>No se encontraron ofertas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard