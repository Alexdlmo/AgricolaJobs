import { Link } from 'react-router-dom'
import './NotFound.css'
function NotFound() {
  return (
    <div className="not- found- page">
      <div className="not- found- container">
        <h1>404</h1>
        <p>Página no encontrada</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    </div>
  )
}
export default NotFound