import { Link } from 'react-router-dom'
import './Home.css'
function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Encuentra trabajo en el campo olivarero</h1>
          <p>Conecta con empresas agrícolas que buscan trabajadores. Regístrate gratis y accede a ofertas.</p>
        </div>
      </section>
      <section className="features">
        <div className="features-container">
          <h2>¿Por qué elegir Agrícola Jobs?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🌳</span>
              <h3>Para Trabajadores</h3>
              <ul><li>Registro gratuito</li><li>Búsqueda por zona</li><li>Notificaciones</li><li>Historial</li></ul>
              <Link to="/register" className="btn-feature">Crear cuenta</Link>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🏢</span>
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