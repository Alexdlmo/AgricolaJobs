import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getSession, logout } from '../utils/authService'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  const checkSession = () => {
    const session = getSession()
    setUser(session)
  }

  useEffect(() => {
    checkSession()
    
    const interval = setInterval(checkSession, 1000)
    
    window.addEventListener('storage', checkSession)
    
    const handleStorageChange = (e) => {
      if (e.key === 'agricolaJobsSession') {
        checkSession()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'worker': return '👨‍🌾'
      case 'company': return '🏢'
      case 'admin': return '⚙️'
      default: return '👤'
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
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/offers" onClick={() => setMenuOpen(false)}>Ofertas</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Panel</Link>
          <Link to="/profile" onClick={() => setMenuOpen(false)}>Perfil</Link>
          <div className="navbar-auth">
            {user ? (
              <div className="user-menu">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{getRoleIcon(user.role)} {getRoleLabel(user.role)}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-login">Iniciar sesión</Link>
                <Link to="/register" className="btn-register">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar