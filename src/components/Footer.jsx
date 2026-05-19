import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Shield, FileText } from 'lucide-react'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section footer-brand">
          <div className="footer-logo">
            <img src="/favicon.png" alt="logo" className="footer-logo-img" />
            <span>Agrícola Jobs</span>
          </div>
          <p>Conectando el sector olivarero con profesionales del campo. La plataforma líder en empleo agrícola en España.</p>
        </div>
        
        <div className="footer-section">
          <h4>Navegación</h4>
          <nav className="footer-nav">
            <Link to="/">Inicio</Link>
            <Link to="/offers">Ofertas</Link>
            <Link to="/register">Registrarse</Link>
            <Link to="/login">Iniciar sesión</Link>
          </nav>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <nav className="footer-nav">
            <a href="#"><FileText size={14} /> Términos</a>
            <a href="#"><Shield size={14} /> Privacidad</a>
          </nav>
        </div>
        
        <div className="footer-section">
          <h4>Contacto</h4>
          <div className="footer-contact">
            <a href="mailto:info@agricolajobs.com"><Mail size={16} /> info@agricolajobs.com</a>
            <a href="tel:+34600000000"><Phone size={16} /> +34 600 000 000</a>
            <span><MapPin size={16} /> Andalucía, España</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {currentYear} Agrícola Jobs. IES Luis Carrillo de Sotomayor.</p>
      </div>
    </footer>
  )
}

export default Footer