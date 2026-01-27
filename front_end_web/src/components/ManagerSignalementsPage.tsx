import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/manager.css'

interface Signalement {
  idSignalement: number
  titre: string
  description: string
  latitude: number
  longitude: number
  surfaceMetreCarree: number
  dateCreation: string
  urlPhoto?: string
  etatActuelId?: number
  etatLibelle?: string
  idTypeTravail?: number
  typeTravauxLibelle?: string
}

interface PaginatedResponse {
  items: Signalement[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ManagerSignalementsPage() {
  const navigate = useNavigate()
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [typeFilter, setTypeFilter] = useState<number | undefined>()
  
  const [statusOptions, setStatusOptions] = useState<{idEtatSignalement: number, libelle: string}[]>([])
  const [typeOptions, setTypeOptions] = useState<{idTypeTravail: number, libelle: string}[]>([])

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadSignalements()
  }, [currentPage, statusFilter, typeFilter])

  async function loadFilterOptions() {
    try {
      const [statusRes, typeRes] = await Promise.all([
        fetch('/api/signalements/etats'),
        fetch('/api/signalements/types')
      ])
      
      if (statusRes.ok) setStatusOptions(await statusRes.json())
      if (typeRes.ok) setTypeOptions(await typeRes.json())
    } catch (err) {
      console.warn('Erreur chargement options filtres:', err)
    }
  }

  async function loadSignalements() {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Non authentifié')
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (statusFilter) params.append('etat', statusFilter.toString())
      if (typeFilter) params.append('type', typeFilter.toString())
      
      const response = await fetch(`/api/manager/signalements?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.status === 403) {
        setError('Accès réservé aux Managers')
        return
      }
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      
      const apiResponse = await response.json()
      const data = apiResponse.data as PaginatedResponse
      
      setSignalements(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.page || 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleRowClick(id: number) {
    navigate(`/manager/signalements/${id}`)
  }

  async function handleDelete(id: number, titre: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${titre}" ?`)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/manager/signalements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        alert('Signalement supprimé')
        loadSignalements()
      } else {
        const err = await response.json()
        alert('Erreur: ' + err.message)
      }
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  if (loading && signalements.length === 0) {
    return (
      <div className="manager-container">
        <div className="manager-loading">Chargement...</div>
      </div>
    )
  }

  if (error && signalements.length === 0) {
    return (
      <div className="manager-container">
        <div className="manager-error">
          <p>⚠️ {error}</p>
          <button onClick={loadSignalements} className="retry-button">Réessayer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>Gestion des Signalements (Manager)</h1>
        <p className="manager-subtitle">
          {total} signalement{total !== 1 ? 's' : ''} au total
        </p>
      </div>

      <div className="manager-filters">
        <div className="filter-group">
          <label>État</label>
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? parseInt(e.target.value) : undefined)
              setCurrentPage(1)
            }}
          >
            <option value="">Tous</option>
            {statusOptions.map(opt => (
              <option key={opt.idEtatSignalement} value={opt.idEtatSignalement}>
                {opt.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Type de travail</label>
          <select
            value={typeFilter || ''}
            onChange={(e) => {
              setTypeFilter(e.target.value ? parseInt(e.target.value) : undefined)
              setCurrentPage(1)
            }}
          >
            <option value="">Tous</option>
            {typeOptions.map(opt => (
              <option key={opt.idTypeTravail} value={opt.idTypeTravail}>
                {opt.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="manager-table-wrapper">
        <table className="manager-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Type</th>
              <th>État</th>
              <th>Surface (m²)</th>
              <th>Date création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {signalements.map(sig => (
              <tr key={sig.idSignalement} onClick={() => handleRowClick(sig.idSignalement)}>
                <td>{sig.idSignalement}</td>
                <td>{sig.titre}</td>
                <td>{sig.typeTravauxLibelle || '-'}</td>
                <td>
                  <span className={`badge badge-${sig.etatActuelId || 1}`}>
                    {sig.etatLibelle || 'Inconnu'}
                  </span>
                </td>
                <td>{sig.surfaceMetreCarree?.toFixed(2) || '-'}</td>
                <td>{new Date(sig.dateCreation).toLocaleDateString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(sig.idSignalement, sig.titre)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="manager-pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span>Page {currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
