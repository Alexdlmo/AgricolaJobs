import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { getOffersByCompany, getReviewsForUser, getUserAverageRating } from '../utils/authService'
import { useAuth } from '../context/AuthContext'
import { Building2, MapPin, DollarSign, Star, Phone, Mail, User, ArrowLeft, Flag } from 'lucide-react'
import ReportModal from '../components/ReportModal'
import './CompanyPage.css'

function CompanyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [offers, setOffers] = useState([])
  const [reviews, setReviews] = useState([])
  const [ratingData, setRatingData] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    loadCompany()
  }, [id])

  const loadCompany = async () => {
    setLoading(true)
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (companyError || !companyData) {
        navigate('/not-found')
        return
      }

      if (companyData.role !== 'company') {
        navigate('/not-found')
        return
      }

      setCompany(companyData)

      const companyOffers = await getOffersByCompany(id)
      setOffers(companyOffers.filter(o => o.status === 'active'))

      try {
        const rating = await getUserAverageRating(id)
        setRatingData(rating)
        const companyReviews = await getReviewsForUser(id)
        setReviews(companyReviews || [])
      } catch (error) {
        console.error('Error loading reviews:', error)
      }
    } catch (error) {
      console.error('Error loading company:', error)
      navigate('/not-found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="company-page">
        <div className="company-container">
          <p className="loading-text">Cargando empresa...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="company-page">
        <div className="company-container">
          <p className="loading-text">Empresa no encontrada</p>
          <button onClick={() => navigate('/dashboard')} className="btn-back-company">
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="company-page">
      <div className="company-container">
        <button onClick={() => navigate(-1)} className="btn-back-company">
          <ArrowLeft size={18} /> Volver
        </button>

        <div className="company-header">
          <div className="company-avatar-large">
            {company.avatar_url ? (
              <img src={company.avatar_url} alt={company.name} />
            ) : (
              <Building2 size={48} />
            )}
          </div>
          <div className="company-header-info">
            <h1>{company.name}</h1>
            {ratingData.count > 0 && (
              <div className="company-rating-row">
                <Star size={18} fill="#fbbf24" color="#fbbf24" />
                <span className="rating-value">{ratingData.average}</span>
                <span className="rating-count">({ratingData.count} reseñas)</span>
              </div>
            )}
          </div>
          {user && user.id !== company.id && (
            <button className="btn-report-company" onClick={() => setShowReportModal(true)}>
              <Flag size={16} /> Reportar
            </button>
          )}
        </div>

        <div className="company-details">
          <h3>Información de contacto</h3>
          <div className="company-contact-grid">
            {company.email && (
              <div className="contact-item">
                <Mail size={18} />
                <span>{company.email}</span>
              </div>
            )}
            {company.phone && (
              <div className="contact-item">
                <Phone size={18} />
                <span>{company.phone}</span>
              </div>
            )}
            {company.contact_person && (
              <div className="contact-item">
                <User size={18} />
                <span>Contacto: {company.contact_person}</span>
              </div>
            )}
            {company.cif && (
              <div className="contact-item">
                <Building2 size={18} />
                <span>CIF: {company.cif}</span>
              </div>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="company-reviews-section">
            <h3>Reseñas ({ratingData.count})</h3>
            <div className="company-reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="company-review-card">
                  <div className="review-header">
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= review.rating ? '#fbbf24' : 'none'}
                          color={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                        />
                      ))}
                    </div>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                  <span className="reviewer-name">Por: {review.reviewer?.name || 'Usuario'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="company-offers-section">
          <h3>Ofertas activas ({offers.length})</h3>
          {offers.length === 0 ? (
            <p className="no-offers-company">Esta empresa no tiene ofertas activas actualmente</p>
          ) : (
            <div className="company-offers-grid">
              {offers.map(offer => (
                <Link to={`/offer/${offer.id}`} key={offer.id} className="company-offer-card">
                  <h4>{offer.title}</h4>
                  <p className="offer-location"><MapPin size={14} /> {offer.location}</p>
                  <p className="offer-salary"><DollarSign size={14} /> {offer.salary}€/día</p>
                  <p className="offer-description">{offer.description?.substring(0, 120)}...</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedId={company.id}
          offerId={null}
          reporterId={user?.id}
          type="company"
        />
      )}
    </div>
  )
}

export default CompanyPage