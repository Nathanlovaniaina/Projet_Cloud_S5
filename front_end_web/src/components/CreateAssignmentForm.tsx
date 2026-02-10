import { useState, useEffect } from 'react'
import '../styles/CreateAssignmentForm.css'

interface Entreprise {
  idEntreprise: number
  nomEntreprise: string
}

interface Props {
  signalementId: string | number
  budget?: number
  niveau?: number
  onSuccess: () => void
  onCancel: () => void
}

export default function CreateAssignmentForm({ signalementId, budget, niveau, onSuccess, onCancel }: Props) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [entrepriseId, setEntrepriseId] = useState<string>('')
  const [dateDebut, setDateDebut] = useState<string>('')
  const [dateFin, setDateFin] = useState<string>('')
  const [montant, setMontant] = useState<string>(budget ? budget.toString() : '')

  useEffect(() => {
    loadEntreprises()
  }, [])

  useEffect(() => {
    if (budget) {
      setMontant(budget.toString())
    }
  }, [budget])

  async function loadEntreprises() {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Token non trouvé')
        return
      }
      
      const res = await fetch('/api/enterprises', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des entreprises')
      }
      
      const data = await res.json()
      const items = data.map((d: any) => ({
        idEntreprise: d.idEntreprise || d.id,
        nomEntreprise: d.nomDuCompagnie || d.nomEntreprise || d.nom || d.name || `Entreprise ${d.idEntreprise || d.id}`
      }))
      setEntreprises(items)
    } catch (err) {
      console.error('Erreur chargement entreprises:', err)
      alert('Impossible de charger la liste des entreprises')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!entrepriseId) {
      alert('Veuillez sélectionner une entreprise')
      return
    }
    
    if (!niveau) {
      alert('Le signalement doit avoir un niveau défini avant de pouvoir assigner une entreprise')
      return
    }
    
    if (!budget) {
      alert('Le signalement doit avoir un budget défini avant de pouvoir assigner une entreprise')
      return
    }
    
    if (!confirm(`Confirmer la création de l'assignation pour l'entreprise sélectionnée ?`)) {
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Token non trouvé')
        return
      }

      const body = {
        idEntreprise: parseInt(entrepriseId),
        dateDebut,
        dateFin,
        montant: montant ? parseFloat(montant) : 0
      }

      const response = await fetch(`/api/manager/signalements/${signalementId}/assign-enterprise`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        alert('Assignation créée avec succès')
        onSuccess()
      } else {
        alert('Erreur création assignation: ' + (result.message || response.status))
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err)
      alert('Erreur lors de la création d\'assignation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="create-assignment-form">
        <p>Chargement des entreprises...</p>
      </div>
    )
  }

  return (
    <div className="create-assignment-form">
      {(!niveau || !budget) && (
        <div style={{
          padding: '12px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#92400e',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <div>
            <strong>Attention :</strong> Ce signalement n'a pas de {!niveau && !budget ? 'niveau ni de budget' : !niveau ? 'niveau' : 'budget'} défini.
            <br />
            Veuillez d'abord définir {!niveau && !budget ? 'le niveau et le budget' : !niveau ? 'le niveau' : 'le budget'} avant de créer une assignation.
          </div>
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Entreprise</label>
        <select
          className="form-select"
          value={entrepriseId}
          onChange={(e) => setEntrepriseId(e.target.value)}
          disabled={submitting}
        >
          <option value="">Sélectionner une entreprise</option>
          {entreprises.map(ent => (
            <option key={String(ent.idEntreprise)} value={String(ent.idEntreprise)}>
              {ent.nomEntreprise || `Entreprise ${ent.idEntreprise}`}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date de début</label>
          <input
            type="date"
            className="form-input"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date de fin</label>
          <input
            type="date"
            className="form-input"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Montant (Ar)</label>
        <input
          type="number"
          className="form-input"
          value={montant}
          readOnly
          placeholder="0.00"
          disabled={submitting}
        />
        {budget && (
          <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
            Montant pré-rempli avec le budget du signalement
          </div>
        )}
      </div>

      <div className="form-actions">
        <button 
          onClick={onCancel} 
          className="action-button action-secondary"
          disabled={submitting}
        >
          Annuler
        </button>
        <button 
          onClick={handleSubmit} 
          className="action-button action-primary"
          disabled={submitting || !niveau || !budget}
          style={{
            opacity: (!niveau || !budget) ? 0.5 : 1,
            cursor: (!niveau || !budget) ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Création...' : 'Créer l\'assignation'}
        </button>
      </div>
    </div>
  )
}