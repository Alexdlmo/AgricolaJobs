import { Link } from 'react-router-dom'
import { Home, Search, AlertTriangle } from 'lucide-react'
import './NotFound.css'

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-container">
        <div className="notfound-icon">
          <AlertTriangle size={64} />
        </div>
        <h1 className="notfound-title">404</h1>
        <h2 className="notfound-subtitle">Página no encontrada</h2>
        <p className="notfound-text">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn-primary">
            <Home size={20} />
            Volver al inicio
          </Link>
          <Link to="/offers" className="notfound-btn-secondary">
            <Search size={20} />
            Ver ofertas
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound