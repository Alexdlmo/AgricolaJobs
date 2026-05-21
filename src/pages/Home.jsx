import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Tractor, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const images = ['/img/agricola1.jpg', '/img/agricola2.jpg', '/img/agricola3.jpg']

function Home() {
  const { user } = useAuth()
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-slider">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Olivar ${index + 1}`}
              className={index === currentImage ? 'active' : ''}
            />
          ))}
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Encuentra trabajo en el campo olivarero</h1>
          <p>Conecta con empresas agrícolas que buscan trabajadores. Regístrate gratis y accede a ofertas.</p>
          {!user && (
            <div className="hero-buttons">
              <Link to="/register" className="btn-hero">Crear cuenta</Link>
              <Link to="/login" className="btn-hero btn-hero-secondary">Iniciar sesión</Link>
            </div>
          )}
        </div>
      </section>
      <section className="features">
        <div className="features-container">
          <h2>¿Por qué elegir Agrícola Jobs?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Tractor size={40} /></div>
              <h3>Para Trabajadores</h3>
              <ul><li>Registro gratuito</li><li>Búsqueda por zona</li><li>Notificaciones</li><li>Historial</li></ul>
              <Link to="/register" className="btn-feature">Crear cuenta</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Building2 size={40} /></div>
              <h3>Para Empresas</h3>
              <ul><li>Vacantes ilimitadas</li><li>Búsqueda trabajadores</li><li>Contratación directa</li><li>Gestión</li></ul>
              <Link to="/register?role=company" className="btn-feature">Registrar empresa</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
export default Home