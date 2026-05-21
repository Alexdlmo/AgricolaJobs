import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Tractor, Building2, Settings, LogOut } from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'worker': return <Tractor size={16} />
      case 'company': return <Building2 size={16} />
      case 'admin': return <Settings size={16} />
      default: return null
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'worker': return 'Trabajador'
      case 'company': return 'Empresa'
      case 'admin': return 'Admin'
      default: return ''
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/favicon.png" alt="logo" className="logo-img" />
          <span>Agrícola Jobs</span>
        </Link>
        <div className="navbar-links">
          {user && (
            <>
              <Link to="/offers">Ofertas</Link>
              <Link to="/dashboard">Panel</Link>
              <Link to="/profile">Perfil</Link>
            </>
          )}
          <div className="navbar-auth">
            {user && (
              <div className="user-menu">
                <div className="user-avatar">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="user-avatar-img" />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar