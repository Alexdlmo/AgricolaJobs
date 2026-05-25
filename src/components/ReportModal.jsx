import { useState } from 'react'
import { createReport } from '../utils/authService'
import { Flag, X, Loader } from 'lucide-react'
import './ReportModal.css'

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'fake_offer', label: 'Oferta falsa o engañosa' },
  { value: 'spam', label: 'Spam o publicidad' },
  { value: 'harassment', label: 'Acoso o mal comportamiento' },
  { value: 'other', label: 'Otro motivo' }
]

function ReportModal({ isOpen, onClose, reportedId, offerId, reporterId, type }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) {
      setError('Selecciona un motivo')
      return
    }

    setSending(true)
    setError('')

    try {
      await createReport({
        reporter_id: reporterId,
        reported_id: reportedId,
        offer_id: offerId,
        reason,
        description
      })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    setSent(false)
    setError('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Flag size={18} /> Reportar {type === 'company' ? 'empresa' : 'contenido'}</h3>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="modal-body">
            <div className="report-success">
              <div className="success-icon">✓</div>
              <h4>Reporte enviado</h4>
              <p>Gracias por tu colaboración. Revisaremos el reporte lo antes posible.</p>
              <button className="btn-submit" onClick={handleClose} style={{ marginTop: '1rem', width: '100%' }}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>Motivo del reporte</label>
                <select
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setError('') }}
                  className="report-select"
                  required
                >
                  <option value="">Selecciona un motivo...</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Añade más detalles sobre el reporte..."
                  rows={4}
                />
              </div>

              {error && <p className="error-text">{error}</p>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={sending || !reason}>
                {sending ? <><Loader size={16} className="spin" /> Enviando...</> : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReportModal