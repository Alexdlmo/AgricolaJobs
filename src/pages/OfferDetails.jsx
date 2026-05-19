import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession } from '../utils/authService'
import { MapPin, DollarSign } from 'lucide-react'
import './Offers.css'

function OfferDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [offer, setOffer] = useState(null)
  const [company, setCompany] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationId, setApplicationId] = useState(null)

  useEffect(() => {
    const session = getSession()
    setUser(session)
    loadOffer()
  }, [id])

  const loadOffer = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('../utils/supabaseClient')
      
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (offerError) throw offerError
      setOffer(offerData)

      if (offerData?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('users')
          .select('name, phone, contact_person, email')
          .eq('id', offerData.company_id)
          .maybeSingle()

        if (!companyError) {
          setCompany(companyData)
        }
      }

      const session = getSession()
      if (session && session.role === 'worker') {
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('id')
          .eq('offer_id', id)
          .eq('worker_id', session.id)
          .maybeSingle()

        if (!appError && appData) {
          setHasApplied(true)
          setApplicationId(appData.id)
        }
      }
    } catch (error) {
      console.error('Error loading offer:', error)
      alert('Error al cargar la oferta')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user || user.role !== 'worker') {
      alert('Debes iniciar sesión como trabajador para aplicar')
      return
    }
    
    setApplying(true)
    try {
      const { supabase } = await import('../utils/supabaseClient')
      
      if (hasApplied && applicationId) {
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('id', applicationId)
        
        if (error) throw error
        setHasApplied(false)
        setApplicationId(null)
        alert('Solicitud cancelada correctamente')
      } else {
        const { data: newApp, error } = await supabase
          .from('applications')
          .insert({
            offer_id: id,
            worker_id: user.id,
            status: 'pending'
          })
          .select('id')
          .single()
        
        if (error) throw error
        
        if (newApp) {
          setApplicationId(newApp.id)
        }
        setHasApplied(true)
        alert('¡Solicitud enviada correctamente!')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="offers-page">
        <div className="offers-container">
          <p className="no-offers">Cargando detalles...</p>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="offers-page">
        <div className="offers-container">
          <p className="no-offers">Oferta no encontrada</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isWorker = user?.role === 'worker'

  return (
    <div className="offers-page">
      <div className="offers-container">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Volver
        </button>

        <div className="offer-details">
          <div className="details-header">
            <h1>{offer.title}</h1>
            <span className={`status-badge ${offer.status}`}>
              {offer.status === 'active' ? 'Activo' : 
               offer.status === 'inactive' ? 'Inactivo' : 'Activo'}
            </span>
          </div>

          <div className="details-meta">
            <div className="meta-item">
              <span className="meta-icon"><MapPin size={16} /></span>
              <span>{offer.location}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon"><DollarSign size={16} /></span>
              <span>{offer.salary}€/día</span>
            </div>
          </div>

          <div className="details-section">
            <h2>Descripción del puesto</h2>
            <p className="description-text">{offer.description}</p>
          </div>

          <div className="details-section">
            <h2>Datos de la empresa</h2>
            <div className="company-info">
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{company?.name || 'Empresa'}</span>
              </div>
              {company?.contact_person && (
                <div className="info-row">
                  <span className="info-label">Persona de contacto:</span>
                  <span className="info-value">{company.contact_person}</span>
                </div>
              )}
              {company?.phone && (
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">{company.phone}</span>
                </div>
              )}
              {company?.email && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{company.email}</span>
                </div>
              )}
            </div>
          </div>

          {isWorker && (
            <div className="details-actions">
              <button 
                onClick={handleApply} 
                className={hasApplied ? 'btn-cancel-offer' : 'btn-primary'}
                disabled={applying}
              >
                {applying ? 'Procesando...' : hasApplied ? 'Cancelar Empleo' : 'Solicitar este empleo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfferDetails