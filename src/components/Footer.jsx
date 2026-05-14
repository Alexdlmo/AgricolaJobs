import './Footer.css'
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3><img src="/favicon.png" alt="logo" style={{width: 30, height: 30, verticalAlign: 'middle', marginRight: 8}} />Agrícola Jobs</h3>
          <p>Plataforma digital que conecta empresas agrícolas con trabajadores del sector olivarero.</p>
        </div>
        <div className="footer-section">
          <h4>Enlaces</h4>
          <a href="/">Inicio</a>
          <a href="/offers">Ofertas</a>
          <a href="/register">Registrarse</a>
        </div>
        <div className="footer-section">
          <h4>Contacto</h4>
          <p>📧 info@agricolajobs.com</p>
          <p>📱 +34 600 000 000</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025-2026 Agrícola Jobs. IES Luis Carrillo de Sotomayor.</p>
      </div>
    </footer>
  )
}
export default Footer