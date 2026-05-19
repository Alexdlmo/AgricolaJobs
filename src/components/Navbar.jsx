import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Menu, X, Tractor, Building2, Settings, LogOut } from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
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
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
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