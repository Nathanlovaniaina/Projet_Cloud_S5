import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/managerSignalementDetail.css'
import CreateAssignmentForm from './CreateAssignmentForm'

interface SignalementDetails {
  idSignalement: number
  titre: string
  description: string
  latitude: number
  longitude: number
  surfaceMetreCarree: number
  dateCreation: string
  urlPhoto?: string
  currentEtatId?: number
  currentEtatLibelle?: string
  progressionPercent?: number
  niveau?: number
  budget?: number
  assignations: Array<{
    idEntrepriseConcerner: number
    idEntreprise?: number
    nomEntreprise: string
    statutLibelle: string
    dateDebut: string
    dateFin: string
    montant: number
    idStatutAssignation: number
  }>
  historiqueEtat: Array<{
    idEtat: number
    libelle: string
    dateChangement: string
  }>
}

export default function ManagerSignalementDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [details, setDetails] = useState<SignalementDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showNiveauModal, setShowNiveauModal] = useState(false)
  const [selectedAssignId, setSelectedAssignId] = useState<number | null>(null)

  const [statusOptions, setStatusOptions] = useState<{idEtatSignalement: number, libelle: string}[]>([]);
  const [dateChangement, setDateChangement] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [niveau, setNiveau] = useState<number>(1)
  const [assignStatusOptions] = useState([
    { id: 1, libelle: 'En attente' },
    { id: 2, libelle: 'Acceptée' },
    { id: 3, libelle: 'Refusée' },
    { id: 4, libelle: 'En cours' },
    { id: 5, libelle: 'Terminée' }
  ])

  useEffect(() => {
    loadDetails()
    loadStatusOptions()
    loadProgress()
  }, [id])

  async function loadProgress() {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/signalements/${id}/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setProgress(data.progress || 0)
      }
    } catch (err) {
      console.warn('Erreur chargement progression:', err)
    }
  }

  async function loadStatusOptions() {
    try {
      const res = await fetch('/api/signalements/etats')
      if (res.ok) setStatusOptions(await res.json())
    } catch (err) {
      console.warn('Erreur chargement états:', err)
    }
  }

  async function loadDetails() {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/manager/signalements/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.status === 403) {
        setError('Accès réservé aux Managers')
        return
      }
      
      if (!response.ok) throw new Error('Erreur chargement')
      
      const apiResponse = await response.json()
      setDetails(apiResponse.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeStatus(newEtatId: number, dateChangement: string) {
    try {
      if (!confirm(`Confirmer le changement d'état du signalement #${details?.idSignalement} ?`)) return
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/manager/signalements/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ etatId: newEtatId, dateChangement })
      })

      const result = await response.json()
      if (response.ok) {
        alert('État modifié avec succès')
        loadDetails()
        loadProgress()
        setShowStatusModal(false)
      } else {
        alert('Erreur: ' + result.message)
      }
    } catch (err) {
      alert('Erreur lors du changement d\'état')
    }
  }

  async function handleChangeAssignStatus(assignId: number, newStatusId: number) {
    try {
      const token = localStorage.getItem('token')
      const assign = details?.assignations.find(a => a.idEntrepriseConcerner === assignId)
      if (!assign) return

      // The backend endpoint expects the enterprise id (idEntreprise), not the assignation id (idEntrepriseConcerner)
      const enterpriseId = (assign as any).idEntreprise || assignId
      if (!confirm(`Confirmer le changement de statut de l'assignation de ${assign.nomEntreprise} ?`)) return
      
      const response = await fetch(`/api/manager/signalements/${id}/assign-enterprise/${enterpriseId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idStatutAssignation: newStatusId })
      })

      const result = await response.json()
      if (response.ok) {
        alert('Statut d\'assignation modifié')
        loadDetails()
        setShowAssignModal(false)
        setSelectedAssignId(null)
      } else {
        alert('Erreur: ' + result.message)
      }
    } catch (err) {
      alert('Erreur lors du changement de statut d\'assignation')
    }
  }

  async function handleSetNiveau(niveauValue: number) {
    try {
      if (niveauValue < 1 || niveauValue > 10) {
        alert('Le niveau doit être entre 1 et 10')
        return
      }

      if (!confirm(`Confirmer l'assignation du niveau ${niveauValue} au signalement #${details?.idSignalement} ?`)) return
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/manager/signalements/${id}/niveau`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ niveau: niveauValue })
      })

      const result = await response.json()
      if (response.ok) {
        alert('Niveau assigné avec succès')
        loadDetails()
        setShowNiveauModal(false)
      } else {
        alert('Erreur: ' + result.message)
      }
    } catch (err) {
      alert('Erreur lors de l\'assignation du niveau')
    }
  }

  function handleAssignSuccess() {
    setShowAssignModal(false)
    loadDetails()
  }

  // Fonction pour obtenir la classe CSS du badge selon l'état
  const getStatusBadgeClass = (etatLibelle?: string, etatId?: number) => {
    if (!etatLibelle) return 'status-unknown'
    
    const etat = etatLibelle.toLowerCase()
    if (etat.includes('en attente') || etat.includes('attente') || etatId === 1) {
      return 'status-pending'
    }
    if (etat.includes('accepté') || etat.includes('accepte') || etatId === 2) {
      return 'status-accepted'
    }
    if (etat.includes('refusé') || etat.includes('refuse') || etatId === 3) {
      return 'status-refused'
    }
    if (etat.includes('en cours') || etat.includes('cours') || etatId === 4) {
      return 'status-inprogress'
    }
    if (etat.includes('terminé') || etat.includes('termine') || etat.includes('terminée') || etatId === 5) {
      return 'status-completed'
    }
    return 'status-unknown'
  }

  // Fonction pour obtenir la classe CSS du badge d'assignation
  const getAssignStatusBadgeClass = (statutLibelle?: string, statutId?: number) => {
    if (!statutLibelle) return 'assign-status-unknown'
    
    const statut = statutLibelle.toLowerCase()
    if (statut.includes('en attente') || statut.includes('attente') || statutId === 1) {
      return 'assign-status-pending'
    }
    if (statut.includes('accepté') || statut.includes('accepte') || statut.includes('acceptée') || statutId === 2) {
      return 'assign-status-accepted'
    }
    if (statut.includes('refusé') || statut.includes('refuse') || statut.includes('refusée') || statutId === 3) {
      return 'assign-status-refused'
    }
    if (statut.includes('en cours') || statut.includes('cours') || statutId === 4) {
      return 'assign-status-inprogress'
    }
    if (statut.includes('terminé') || statut.includes('termine') || statut.includes('terminée') || statutId === 5) {
      return 'assign-status-completed'
    }
    return 'assign-status-unknown'
  }

  // Fonction pour formater les dates
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateStr
    }
  }

  // Fonction pour formater les montants
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant)
  }

  if (loading) {
    return (
      <div className="manager-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="manager-container">
        <div className="error-container">
          <div className="error-content">
            <h3>Erreur de chargement</h3>
            <p>{error || 'Signalement introuvable'}</p>
            <button 
              onClick={() => navigate('/manager/signalements')} 
              className="action-button action-view"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-container">
      <div className="detail-header">
        <div className="header-content">
          <button 
            onClick={() => navigate('/manager/signalements')} 
            className="back-button"
          >
            Retour aux signalements
          </button>
          <div className="header-title-section">
            <h1 className="detail-title">Signalement #{details.idSignalement}</h1>
            <p className="detail-subtitle">{details.titre}</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => { setNiveau(1); setShowNiveauModal(true) }} 
              className="action-button action-primary"
            >
              Définir le niveau
            </button>
            <button 
              onClick={() => { setDateChangement(new Date().toISOString().slice(0,16)); setShowStatusModal(true) }} 
              className="action-button action-change-status"
            >
              Changer l'état
            </button>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-grid">
          {/* Carte d'informations générales */}
          <div className="detail-card">
            <div className="card-header">
              <h2 className="card-title">Informations Générales</h2>
              <span className={`status-badge ${getStatusBadgeClass(details.currentEtatLibelle, details.currentEtatId)}`}>
                {details.currentEtatLibelle} • {progress}%
              </span>
            </div>
            
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Description</div>
                  <div className="info-value">{details.description}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Surface</div>
                  <div className="info-value highlight">
                    {details.surfaceMetreCarree?.toFixed(2)} m²
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Niveau</div>
                  <div className="info-value">
                    {details.niveau ? (
                      <span className="niveau-badge">
                        <span className="niveau-value">{details.niveau}</span>/10
                      </span>
                    ) : (
                      <span style={{color: '#9ca3af'}}>Non défini</span>
                    )}
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Budget</div>
                  <div className="info-value highlight">
                    {details.budget ? (
                      <span style={{fontWeight: 600, color: '#10b981'}}>
                        {details.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                      </span>
                    ) : (
                      <span style={{color: '#9ca3af'}}>Non défini</span>
                    )}
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Date de création</div>
                  <div className="info-value">{formatDate(details.dateCreation)}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Coordonnées</div>
                  <div className="info-value">
                    {details.latitude.toFixed(6)}, {details.longitude.toFixed(6)}
                  </div>
                </div>
                
                {details.urlPhoto && (
                  <div className="info-item">
                    <div className="info-label">Photo</div>
                    <div className="info-value">
                      <a 
                        href={details.urlPhoto} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="photo-link"
                      >
                        Voir la photo
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carte des assignations */}
          <div className="detail-card">
            <div className="card-header">
              <h2 className="card-title">Assignations d'Entreprises</h2>
              <div className="card-header-actions">
                <span className="badge-count">
                  {details.assignations.length} assignation{details.assignations.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="action-button action-primary"
                >
                  + Assigner une entreprise
                </button>
              </div>
            </div>
            
            <div className="card-body">
              {details.assignations.length === 0 ? (
                <div className="empty-state-card">
                  <p>Aucune entreprise assignée</p>
                  <p className="empty-hint">Cliquez sur "Assigner une entreprise" pour en ajouter une</p>
                </div>
              ) : (
                <div className="assignations-grid">
                  {details.assignations.map(assign => (
                    <div key={assign.idEntrepriseConcerner} className="assignation-card">
                      <div className="assignation-header">
                        <h3 className="assignation-title">{assign.nomEntreprise}</h3>
                        <span className={`assign-status-badge ${getAssignStatusBadgeClass(assign.statutLibelle, assign.idStatutAssignation)}`}>
                          {assign.statutLibelle}
                        </span>
                      </div>
                      
                      <div className="assignation-details">
                        <div className="assignation-row">
                          <span className="assignation-label">Période</span>
                          <span className="assignation-value">
                            {formatDate(assign.dateDebut)} - {formatDate(assign.dateFin)}
                          </span>
                        </div>
                        <div className="assignation-row">
                          <span className="assignation-label">Montant</span>
                          <span className="assignation-value highlight">
                            {formatMontant(assign.montant)} Ar
                          </span>
                        </div>
                        <div className="assignation-row">
                          <span className="assignation-label">ID Entreprise</span>
                          <span className="assignation-value id-value">#{assign.idEntrepriseConcerner}</span>
                        </div>
                      </div>
                      
                      <div className="assignation-actions">
                        <button
                          onClick={() => {
                            setSelectedAssignId(assign.idEntrepriseConcerner)
                            setShowAssignModal(true)
                          }}
                          className="action-button action-secondary"
                        >
                          Modifier statut
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Carte historique des états */}
          <div className="detail-card">
            <div className="card-header">
              <h2 className="card-title">Historique des États</h2>
              <span className="badge-count">
                {details.historiqueEtat.length} changement{details.historiqueEtat.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="card-body">
              {details.historiqueEtat.length === 0 ? (
                <div className="empty-state-card">
                  <p>Aucun historique disponible</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {details.historiqueEtat.map((h, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-timeline-marker"></div>
                      <div className="history-content">
                        <div className="history-header">
                          <span className={`status-badge ${getStatusBadgeClass(h.libelle, h.idEtat)}`}>
                            {h.libelle}
                          </span>
                          <span className="history-date">{formatDate(h.dateChangement)}</span>
                        </div>
                        <div className="history-id">État ID: #{h.idEtat}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour changer l'état du signalement */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Changer l'état du signalement</h3>
              <button 
                onClick={() => setShowStatusModal(false)} 
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Sélectionnez le nouvel état pour le signalement #{details.idSignalement}
              </p>
              
              <div className="form-group">
                <label className="form-label">Date de changement</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={dateChangement}
                  onChange={(e) => setDateChangement(e.target.value)}
                />
              </div>
              
              <div className="options-grid">
                {statusOptions.map(opt => (
                  <button
                    key={opt.idEtatSignalement}
                    onClick={() => handleChangeStatus(opt.idEtatSignalement, dateChangement)}
                    className={`option-button ${getStatusBadgeClass(opt.libelle, opt.idEtatSignalement)}`}
                  >
                    {opt.libelle}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowStatusModal(false)} 
                className="action-button action-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour définir le niveau */}
      {showNiveauModal && (
        <div className="modal-overlay" onClick={() => setShowNiveauModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Définir le niveau du signalement</h3>
              <button 
                onClick={() => setShowNiveauModal(false)} 
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Assignez un niveau de priorité pour le signalement #{details.idSignalement}
              </p>
              <p className="modal-hint">
                Le niveau doit être compris entre 1 (priorité basse) et 10 (priorité maximale)
              </p>
              
              <div className="form-group">
                <label className="form-label">Niveau (1-10)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={10}
                  value={niveau}
                  onChange={(e) => setNiveau(parseInt(e.target.value) || 1)}
                  placeholder="Entrez un niveau entre 1 et 10"
                />
                <div className="form-hint">
                  Niveau actuel sélectionné : <strong>{niveau}</strong>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowNiveauModal(false)} 
                className="action-button action-secondary"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleSetNiveau(niveau)} 
                className="action-button action-primary"
                disabled={niveau < 1 || niveau > 10}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour assignations */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {selectedAssignId ? (
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Changer le statut d'assignation</h3>
                  <button 
                    onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }} 
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body">
                  <p className="modal-description">
                    Sélectionnez le nouveau statut pour cette assignation
                  </p>
                  
                  <div className="options-grid">
                    {assignStatusOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleChangeAssignStatus(selectedAssignId, opt.id)}
                        className={`option-button ${getAssignStatusBadgeClass(opt.libelle, opt.id)}`}
                      >
                        {opt.libelle}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Assigner une entreprise</h3>
                  <button 
                    onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }} 
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body">
                  <CreateAssignmentForm
                    signalementId={id!}
                    budget={details.budget}
                    niveau={details.niveau}
                    onSuccess={handleAssignSuccess}
                    onCancel={() => { setShowAssignModal(false); setSelectedAssignId(null) }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}