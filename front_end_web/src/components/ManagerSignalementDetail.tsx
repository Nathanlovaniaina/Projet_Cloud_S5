import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/manager.css'

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

  // New assignation form state
  const [newEntrepriseId, setNewEntrepriseId] = useState<string>('')
  const [newEntrepriseName, setNewEntrepriseName] = useState<string>('')
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
      // map to id / name
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
      // Trouver l'entrepriseId depuis l'assignation
      const assign = details?.assignations.find(a => a.idEntrepriseConcerner === assignId)
      if (!assign) return

      const response = await fetch(`/api/manager/signalements/${id}/assign-enterprise/${assignId}/status`, {
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
        // refresh details
        loadDetails()
      } else {
        alert('Erreur création assignation: ' + (result.message || response.status))
      }
    } catch (err) {
      alert('Erreur lors de la création d\'assignation')
    }
  }

  if (loading) {
    return <div className="manager-container"><div className="manager-loading">Chargement...</div></div>
  }

  if (error || !details) {
    return (
      <div className="manager-container">
        <div className="manager-error">
          <p>⚠️ {error || 'Signalement introuvable'}</p>
          <button onClick={() => navigate('/manager/signalements')}>Retour à la liste</button>
        </div>
      </div>
    )
  }

  return (
    <div className="manager-container" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      <div className="manager-header">
        <button onClick={() => navigate('/manager/signalements')} className="btn-back">
          ← Retour
        </button>
        <h1>{details.titre}</h1>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Informations générales</h3>
          <div className="detail-row">
            <span>État actuel:</span>
            <span className={`badge badge-${details.currentEtatId || 1}`}>
              {details.currentEtatLibelle} ({details.progressionPercent || 0}%)
            </span>
          </div>
          <div className="detail-row">
            <span>Description:</span>
            <span>{details.description}</span>
          </div>
          <div className="detail-row">
            <span>Surface:</span>
            <span>{details.surfaceMetreCarree?.toFixed(2)} m²</span>
          </div>
          <div className="detail-row">
            <span>Date création:</span>
            <span>{new Date(details.dateCreation).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span>Coordonnées:</span>
            <span>{details.latitude}, {details.longitude}</span>
          </div>

          <button onClick={() => setShowStatusModal(true)} className="btn-action">
            Changer l'état
          </button>
        </div>

        <div className="detail-card">
          <h3>Assignations d'entreprises</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{details.assignations.length} assignation{details.assignations.length !== 1 ? 's' : ''}</div>
            <button
              className="btn-action"
              onClick={() => {
                // open creation modal
                setSelectedAssignId(null)
                setNewEntrepriseId('')
                setNewEntrepriseName('')
                setNewDateDebut('')
                setNewDateFin('')
                setNewMontant('')
                setShowAssignModal(true)
              }}
            >
              Assigner une entreprise
            </button>
          </div>

          {details.assignations.length === 0 ? (
            <p>Aucune entreprise assignée</p>
          ) : (
            <div className="assignations-list">
              {details.assignations.map(assign => (
                <div key={assign.idEntrepriseConcerner} className="assignation-item">
                  <div className="assign-header">
                    <strong>{assign.nomEntreprise}</strong>
                    <span className={`badge badge-assign-${assign.idStatutAssignation}`}>
                      {assign.statutLibelle}
                    </span>
                  </div>
                  <div className="assign-details">
                    <div>Période: {assign.dateDebut} → {assign.dateFin}</div>
                    <div>Montant: {assign.montant} Ar</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAssignId(assign.idEntrepriseConcerner)
                      setShowAssignModal(true)
                    }}
                    className="btn-small"
                  >
                    Modifier statut
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-card">
          <h3>Historique des états</h3>
          <div className="history-list">
            {details.historiqueEtat.map((h, idx) => (
              <div key={idx} className="history-item">
                <div className={`badge badge-${h.idEtat}`}>{h.libelle}</div>
                <div className="history-date">{new Date(h.dateChangement).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Changer l'état du signalement</h3>
            <div className="modal-body">
              {statusOptions.map(opt => (
                <button
                  key={opt.idEtatSignalement}
                  onClick={() => handleChangeStatus(opt.idEtatSignalement)}
                  className="btn-option"
                >
                  {opt.libelle}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatusModal(false)} className="btn-cancel">
              Annuler
            </button>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedAssignId ? (
              <>
                <h3>Changer le statut d'assignation</h3>
                <div className="modal-body">
                  {assignStatusOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleChangeAssignStatus(selectedAssignId, opt.id)}
                      className="btn-option"
                    >
                      {opt.libelle}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }} className="btn-cancel">
                  Annuler
                </button>
              </>
            ) : (
              <>
                <h3>Assigner une entreprise</h3>
                <div className="modal-body">
                  <label>Sélectionner une entreprise</label>
                  <select value={newEntrepriseId} onChange={(e) => { setNewEntrepriseId(e.target.value) }}>
                    <option value="">-- Choisir --</option>
                    {entreprises.map(ent => (
                      <option key={ent.idEntreprise} value={String(ent.idEntreprise)}>{ent.nomEntreprise}</option>
                    ))}
                  </select>
                  

                  <label>Date début</label>
                  <input type="date" value={newDateDebut} onChange={(e) => setNewDateDebut(e.target.value)} />

                  <label>Date fin</label>
                  <input type="date" value={newDateFin} onChange={(e) => setNewDateFin(e.target.value)} />

                  <label>Montant</label>
                  <input type="number" value={newMontant} onChange={(e) => setNewMontant(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleCreateAssign} className="btn-action">Créer</button>
                  <button onClick={() => { setShowAssignModal(false); setSelectedAssignId(null) }} className="btn-cancel">Annuler</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
