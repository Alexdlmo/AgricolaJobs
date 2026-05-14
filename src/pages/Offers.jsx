import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getSession, getAllOffers, createOffer } from '../utils/authService'
import './Offers.css'

function Offers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [offers, setOffers] = useState([])
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true')
  const [formData, setFormData] = useState({ title: '', description: '', location: '', salary: '' })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [appliedOffers, setAppliedOffers] = useState({})

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/login')
      return
    }
    setUser(session)
    loadOffers()
  }, [navigate])

  const loadOffers = async () => {
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      setOffers(allOffers.filter(o => o.status === 'active'))
      
      const session = getSession()
      if (session && session.role === 'worker') {
        const { supabase } = await import('../utils/supabaseClient')
        const { data: applications, error: appError } = await supabase
          .from('applications')
          .select('offer_id')
          .eq('worker_id', session.id)
        
        console.log('Applications loaded:', applications, 'Error:', appError)
        
        const appliedMap = {}
        applications?.forEach(app => {
          appliedMap[String(app.offer_id)] = true
        })
        console.log('Applied map:', appliedMap)
        setAppliedOffers(appliedMap)
      }
    } catch (error) {
      console.error('Error loading offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user || user.role !== 'company') return

    try {
      const newOffer = {
        company_id: user.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        salary: formData.salary,
        status: 'active'
      }
      await createOffer(newOffer)
      await loadOffers()
      setShowForm(false)
      setFormData({ title: '', description: '', location: '', salary: '' })
    } catch (error) {
      alert('Error al crear oferta: ' + error.message)
    }
  }

  const handleApply = async (offerId) => {
    if (!user || user.role !== 'worker') {
      alert('Debes iniciar sesión como trabajador para aplicar')
      return
    }
    
    if (appliedOffers[String(offerId)]) {
      try {
        const { supabase } = await import('../utils/supabaseClient')
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('offer_id', offerId)
          .eq('worker_id', user.id)
        
        if (error) throw error
        setAppliedOffers(prev => ({ ...prev, [offerId]: false }))
        alert('Solicitud cancelada correctamente')
      } catch (error) {
        alert('Error al cancelar: ' + error.message)
      }
      return
    }
    
    setApplying(offerId)
    
    try {
      const { supabase } = await import('../utils/supabaseClient')
      const { error } = await supabase
        .from('applications')
        .insert({
          offer_id: offerId,
          worker_id: user.id,
          status: 'pending'
        })
      
      if (error) throw error
      setAppliedOffers(prev => ({ ...prev, [offerId]: true }))
      alert('¡Solicitud enviada!')
    } catch (error) {
      alert('Error al aplicar: ' + error.message)
    } finally {
      setApplying(null)
    }
  }

  const isCompany = user?.role === 'company'
  const isWorker = user?.role === 'worker'

  return (
    <div className="offers-page">
      <div className="offers-container">
        <div className="offers-header">
          <h1>Ofertas de empleo</h1>
          {isCompany && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-new-offer">
              + Nueva oferta
            </button>
          )}
        </div>

        {showForm && (
          <div className="offer-form-container">
            <h2>Nueva oferta</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Recolector de aceitunas"
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Trabajo en olivar..."
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ubicación</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="Córdoba"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Salario (€/día)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={e => setFormData({...formData, salary: e.target.value})}
                    placeholder="60"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">Publicar</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="no-offers">Cargando ofertas...</p>
        ) : offers.length === 0 ? (
          <p className="no-offers">No hay ofertas publicadas.</p>
        ) : (
          <div className="offers-grid">
            {offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <h3>{offer.title}</h3>
                <p className="offer-company">{offer.name || 'Empresa'}</p>
                <p className="offer-description">{offer.description}</p>
                <div className="offer-meta">
                  <span>📍 {offer.location}</span>
                  <span>💰 {offer.salary}€/día</span>
                </div>
                {isWorker && (
                  <button 
                    onClick={() => handleApply(offer.id)} 
                    className={appliedOffers[String(offer.id)] ? 'btn-apply applied' : 'btn-apply'}
                    disabled={applying === offer.id}
                  >
                    {applying === offer.id ? 'Procesando...' : appliedOffers[String(offer.id)] ? 'Cancelar' : 'Solicitar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Offers