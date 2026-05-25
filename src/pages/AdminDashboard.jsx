import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers, deleteUser, getAllOffers, deleteOffer, updateOfferStatus, createOffer, getDashboardStats, getMonthlyStats, getTopCompanies, getAllReports, updateReportStatus } from '../utils/authService'
import { useAuth } from '../context/AuthContext'
import { BarChart3, Users, Briefcase, Tractor, Building2, Settings, CheckCircle, Pause, Trash2, TrendingUp, Calendar, Download, Flag, Check, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('stats')
  const [users, setUsers] = useState([])
  const [offers, setOffers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerFormData, setOfferFormData] = useState({ title: '', description: '', location: '', salary: '' })
  const [pythonStats, setPythonStats] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [topCompanies, setTopCompanies] = useState([])
  const [timeFilter, setTimeFilter] = useState(12)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const allUsers = await getAllUsers()
      const allOffers = await getAllOffers()
      setUsers(allUsers)
      setOffers(allOffers)

      const stats = await getDashboardStats()
      if (stats && !stats.error) {
        setStatsData(stats)
      }

      const monthly = await getMonthlyStats(timeFilter)
      setMonthlyData(monthly || [])

      const top = await getTopCompanies(5)
      setTopCompanies(top || [])

      const allReports = await getAllReports()
      setReports(allReports || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    loadData()
  }, [user, navigate])

  const handleLogout = async () => {
    await logout()
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
      case 'worker': return <><Tractor size={16} /> Trabajador</>
      case 'company': return <><Building2 size={16} /> Empresa</>
      case 'admin': return <><Settings size={16} /> Admin</>
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
          <span className="brand-icon"><Settings size={24} /></span>
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
            <BarChart3 size={18} /> Estadísticas
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> Usuarios ({stats.totalUsers})
          </button>
          <button
            className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            <Briefcase size={18} /> Ofertas ({stats.totalOffers})
          </button>
          <button
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <Flag size={18} /> Reportes ({reports.filter(r => r.status === 'pending').length})
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="stats-grid">
            {pythonStats && (
              <div className="stat-card python-stat clickable" onClick={() => setActiveTab('users')}>
                <div className="stat-icon"><Users size={24} /></div>
                <div className="stat-info">
                  <span className="stat-number">{pythonStats.total_users || 0}</span>
                  <span className="stat-label">Usuarios (Python API)</span>
                </div>
              </div>
            )}
            <div className="stat-card clickable" onClick={() => { setActiveTab('users'); setSearchTerm('worker'); }}>
              <div className="stat-icon"><Tractor size={24} /></div>
              <div className="stat-info">
                <span className="stat-number">{stats.workers}</span>
                <span className="stat-label">Trabajadores</span>
              </div>
            </div>
            <div className="stat-card clickable" onClick={() => { setActiveTab('users'); setSearchTerm('company'); }}>
              <div className="stat-icon"><Building2 size={24} /></div>
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
              <div className="stat-icon"><CheckCircle size={24} /></div>
              <div className="stat-info">
                <span className="stat-number">{stats.activeOffers}</span>
                <span className="stat-label">Ofertas Activas</span>
              </div>
            </div>
            <div className="stat-card clickable" onClick={() => { setActiveTab('offers'); setSearchTerm('inactive'); }}>
              <div className="stat-icon"><Pause size={24} /></div>
              <div className="stat-info">
                <span className="stat-number">{stats.inactiveOffers}</span>
                <span className="stat-label">Ofertas Inactivas</span>
              </div>
            </div>
          </div>)}

          {statsData && (
            <div className="charts-section">
              <div className="charts-header">
                <h3><TrendingUp size={20} /> Estadísticas detalladas</h3>
                <div className="chart-filters">
                  <select value={timeFilter} onChange={(e) => setTimeFilter(Number(e.target.value))}>
                    <option value={3}>Últimos 3 meses</option>
                    <option value={6}>Últimos 6 meses</option>
                    <option value={12}>Últimos 12 meses</option>
                  </select>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h4>Usuarios nuevos por mes</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#2d5016" name="Usuarios" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>Ofertas publicadas por mes</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="offers" stroke="#2d5016" strokeWidth={2} name="Ofertas" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>Solicitudes por estado</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendientes', value: statsData.pendingApps || 0, color: '#f59e0b' },
                          { name: 'Aceptadas', value: statsData.acceptedApps || 0, color: '#10b981' },
                          { name: 'Rechazadas', value: statsData.rejectedApps || 0, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((index, category) => (
                          <Cell key={`cell-${index}`} fill={[
                            { name: 'Pendientes', value: statsData.pendingApps || 0, color: '#f59e0b' },
                            { name: 'Aceptadas', value: statsData.acceptedApps || 0, color: '#10b981' },
                            { name: 'Rechazadas', value: statsData.rejectedApps || 0, color: '#ef4444' }
                          ][index].color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    <span><span className="dot" style={{ background: '#f59e0b' }}></span> Pendientes ({statsData.pendingApps || 0})</span>
                    <span><span className="dot" style={{ background: '#10b981' }}></span> Aceptadas ({statsData.acceptedApps || 0})</span>
                    <span><span className="dot" style={{ background: '#ef4444' }}></span> Rechazadas ({statsData.rejectedApps || 0})</span>
                  </div>
                </div>

                <div className="chart-card">
                  <h4>Top 5 Empresas con más ofertas</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topCompanies} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2d5016" name="Ofertas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h4>Distribución de usuarios</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Trabajadores', value: statsData.workers || 0, color: '#2d5016' },
                          { name: 'Empresas', value: statsData.companies || 0, color: '#4a7c22' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#2d5016" />
                        <Cell fill="#4a7c22" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    <span><span className="dot" style={{ background: '#2d5016' }}></span> Trabajadores ({statsData.workers || 0})</span>
                    <span><span className="dot" style={{ background: '#4a7c22' }}></span> Empresas ({statsData.companies || 0})</span>
                  </div>
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
                          <Trash2 size={16} />
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
                          <Trash2 size={16} />
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

        {activeTab === 'reports' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Gestión de Reportes</h2>
              <span className="reports-count">{reports.filter(r => r.status === 'pending').length} pendientes</span>
            </div>
            {reports.length === 0 ? (
              <div className="empty-state">
                <Flag size={48} />
                <p>No hay reportes</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Reportador</th>
                      <th>Reportado</th>
                      <th>Motivo</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>{formatDate(report.created_at)}</td>
                        <td>{report.reporter?.name || 'Usuario'}</td>
                        <td>{report.reported?.name || 'Usuario'}</td>
                        <td>{report.reason}</td>
                        <td>{report.description || '-'}</td>
                        <td>
                          <span className={`status-badge-report ${report.status}`}>
                            {report.status === 'pending' ? 'Pendiente' :
                             report.status === 'reviewed' ? 'Revisado' :
                             report.status === 'dismissed' ? 'Desestimado' : 'Resuelto'}
                          </span>
                        </td>
                        <td>
                          <div className="report-actions">
                            {report.status === 'pending' && (
                              <>
                                <button
                                  className="btn-report-action dismiss"
                                  onClick={async () => {
                                    if (confirm('¿Desestimar este reporte?')) {
                                      await updateReportStatus(report.id, 'dismissed')
                                      setReports(await getAllReports())
                                    }
                                  }}
                                  title="Desestimar"
                                >
                                  <X size={16} />
                                </button>
                                <button
                                  className="btn-report-action resolve"
                                  onClick={async () => {
                                    if (confirm('¿Resolver este reporte?')) {
                                      await updateReportStatus(report.id, 'resolved')
                                      setReports(await getAllReports())
                                    }
                                  }}
                                  title="Resolver"
                                >
                                  <Check size={16} />
                                </button>
                              </>
                            )}
                            {(report.status === 'reviewed' || report.status === 'dismissed') && (
                              <button
                                className="btn-report-action resolve"
                                onClick={async () => {
                                  await updateReportStatus(report.id, 'resolved')
                                  setReports(await getAllReports())
                                }}
                                title="Resolver"
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard