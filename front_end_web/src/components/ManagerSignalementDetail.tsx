import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/managerSignalementDetail.css'

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
  const [selectedAssignId, setSelectedAssignId] = useState<number | null>(null)

  const [newEntrepriseId, setNewEntrepriseId] = useState<string>('')
  const [newDateDebut, setNewDateDebut] = useState<string>('')
  const [newDateFin, setNewDateFin] = useState<string>('')
  const [newMontant, setNewMontant] = useState<string>('')
  const [entreprises, setEntreprises] = useState<{idEntreprise: number, nomEntreprise: string}[]>([])

  const [statusOptions, setStatusOptions] = useState<{idEtatSignalement: number, libelle: string}[]>([])
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
    loadEntrepriseOptions()
  }, [id])

  async function loadEntrepriseOptions() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/statistics/by-enterprise', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!res.ok) return
      const body = await res.json()
      const data = body?.data || []
      const items = data.map((d: any) => ({ idEntreprise: d.idEntreprise, nomEntreprise: d.nomEntreprise }))
      setEntreprises(items)
    } catch (err) {
      console.warn('Erreur chargement entreprises:', err)
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

  async function handleChangeStatus(newEtatId: number) {
    try {
      if (!confirm(`Confirmer le changement d'état du signalement #${details?.idSignalement} ?`)) return
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/manager/signalements/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ etatId: newEtatId })
      })

      const result = await response.json()
      if (response.ok) {
        alert('État modifié avec succès')
        loadDetails()
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

  async function handleCreateAssign() {
    try {
      const token = localStorage.getItem('token')
      if (!newEntrepriseId) {
        alert('Veuillez sélectionner une entreprise')
        return
      }
      const body = {
        idEntreprise: parseInt(newEntrepriseId),
        dateDebut: newDateDebut,
        dateFin: newDateFin,
        montant: newMontant ? parseFloat(newMontant) : 0
      }
      if (!confirm(`Confirmer la création de l'assignation pour l'entreprise sélectionnée ?`)) return

      const response = await fetch(`/api/manager/signalements/${id}/assign-enterprise`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json().catch(() => ({}))
      if (response.ok) {
        alert('Assignation créée')
        setShowAssignModal(false)
        loadDetails()
      } else {
        alert('Erreur création assignation: ' + (result.message || response.status))
      }
    } catch (err) {
      alert('Erreur lors de la création d\'assignation')
    }
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
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Erreur de chargement</h3>
            <p>{error || 'Signalement introuvable'}</p>
            <button 
              onClick={() => navigate('/manager/signalements')} 
              className="action-button action-view"
            >
              ← Retour à la liste
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
            ← Retour aux signalements
          </button>
          <div className="header-title-section">
            <h1 className="detail-title">Signalement #{details.idSignalement}</h1>
            <p className="detail-subtitle">{details.titre}</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowStatusModal(true)} 
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
                {details.currentEtatLibelle} • {details.progressionPercent || 0}%
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
                  onClick={() => {
                    setSelectedAssignId(null)
                    setNewEntrepriseId('')
                    setNewDateDebut('')
                    setNewDateFin('')
                    setNewMontant('')
                    setShowAssignModal(true)
                  }}
                  className="action-button action-primary"
                >
                  + Assigner une entreprise
                </button>
              </div>
            </div>
            
            <div className="card-body">
              {details.assignations.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-icon">🏢</div>
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
                            {formatDate(assign.dateDebut)} → {formatDate(assign.dateFin)}
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
                  <div className="empty-icon">📊</div>
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
              
              <div className="options-grid">
                {statusOptions.map(opt => (
                  <button
                    key={opt.idEtatSignalement}
                    onClick={() => handleChangeStatus(opt.idEtatSignalement)}
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
                  <div className="modal-form">
                    <div className="form-group">
                      <label className="form-label">Entreprise</label>
                      <select 
                        className="form-select"
                        value={newEntrepriseId} 
                        onChange={(e) => { setNewEntrepriseId(e.target.value) }}
                      >
                        <option value="">-- Sélectionner une entreprise --</option>
                        {entreprises.map(ent => (
                          <option key={ent.idEntreprise} value={String(ent.idEntreprise)}>
                            {ent.nomEntreprise}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Date début</label>
                        <input 
                          type="date" 
                          className="form-input"
                          value={newDateDebut} 
                          onChange={(e) => setNewDateDebut(e.target.value)} 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Date fin</label>
                        <input 
                          type="date" 
                          className="form-input"
                          value={newDateFin} 
                          onChange={(e) => setNewDateFin(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Montant (Ar)</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={newMontant} 
                        onChange={(e) => setNewMontant(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }} 
                    className="action-button action-secondary"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleCreateAssign} 
                    className="action-button action-primary"
                  >
                    Créer l'assignation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}