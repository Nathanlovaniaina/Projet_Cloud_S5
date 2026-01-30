import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/manager.css'
import SyncButton from './SyncButton'

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

  // Fonction pour obtenir la classe CSS du badge selon l'état
  const getStatusBadgeClass = (etatLibelle?: string, etatActuelId?: number) => {
    if (!etatLibelle) return 'status-unknown'
    
    const etat = etatLibelle.toLowerCase()
    if (etat.includes('en attente') || etat.includes('attente') || etatActuelId === 1) {
      return 'status-pending'
    }
    if (etat.includes('accepté') || etat.includes('accepte') || etatActuelId === 2) {
      return 'status-accepted'
    }
    if (etat.includes('refusé') || etat.includes('refuse') || etatActuelId === 3) {
      return 'status-refused'
    }
    if (etat.includes('en cours') || etat.includes('cours') || etatActuelId === 4) {
      return 'status-inprogress'
    }
    if (etat.includes('terminé') || etat.includes('termine') || etat.includes('terminée') || etatActuelId === 5) {
      return 'status-completed'
    }
    return 'status-unknown'
  }

  // Fonction pour obtenir l'icône de l'état
  const getStatusIcon = (etatLibelle?: string) => {
    if (!etatLibelle) return '❓'
    
    const etat = etatLibelle.toLowerCase()
    if (etat.includes('en attente') || etat.includes('attente')) {
      return '⏳'
    }
    if (etat.includes('accepté') || etat.includes('accepte')) {
      return '✅'
    }
    if (etat.includes('refusé') || etat.includes('refuse')) {
      return '❌'
    }
    if (etat.includes('en cours') || etat.includes('cours')) {
      return '🚧'
    }
    if (etat.includes('terminé') || etat.includes('termine') || etat.includes('terminée')) {
      return '🏁'
    }
    return '❓'
  }

  if (loading && signalements.length === 0) {
    return (
      <div className="manager-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des signalements...</p>
        </div>
      </div>
    )
  }

  if (error && signalements.length === 0) {
    return (
      <div className="manager-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={loadSignalements} className="retry-button">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div className="header-content">
          <div>
            <h1 className="manager-title">Gestion des Signalements</h1>
            <p className="manager-subtitle">
              {total} signalement{total !== 1 ? 's' : ''} au total • Accès Manager
            </p>
          </div>
          <div className="header-actions">
            <SyncButton />
          </div>
        </div>
      </div>

      <div className="manager-filters">
        <div className="filter-group">
          <label className="filter-label">État</label>
          <select
            className="filter-select"
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? parseInt(e.target.value) : undefined)
              setCurrentPage(1)
            }}
          >
            <option value="">Tous les états</option>
            {statusOptions.map(opt => (
              <option key={opt.idEtatSignalement} value={opt.idEtatSignalement}>
                {opt.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Type de travaux</label>
          <select
            className="filter-select"
            value={typeFilter || ''}
            onChange={(e) => {
              setTypeFilter(e.target.value ? parseInt(e.target.value) : undefined)
              setCurrentPage(1)
            }}
          >
            <option value="">Tous les types</option>
            {typeOptions.map(opt => (
              <option key={opt.idTypeTravail} value={opt.idTypeTravail}>
                {opt.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title-section">
            <h2 className="table-title">Liste des Signalements</h2>
            <p className="table-subtitle">Cliquez sur une ligne pour voir les détails</p>
          </div>
          {error && signalements.length > 0 && (
            <div className="table-warning">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Titre</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">État</th>
                <th className="table-header-cell">Surface (m²)</th>
                <th className="table-header-cell">Date création</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signalements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-message">
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <p>Aucun signalement trouvé</p>
                      {total > 0 && <p className="empty-hint">Essayez de modifier vos filtres</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                signalements.map(sig => (
                  <tr 
                    key={sig.idSignalement} 
                    className="table-row"
                    onClick={() => handleRowClick(sig.idSignalement)}
                  >
                    <td className="cell-id">
                      <span className="id-badge">#{sig.idSignalement}</span>
                    </td>
                    <td className="cell-title">
                      <div className="title-content">
                        <div className="title-text">{sig.titre}</div>
                        <div className="title-description">
                          {sig.description && sig.description.length > 60 
                            ? `${sig.description.substring(0, 60)}...` 
                            : sig.description || 'Aucune description'}
                        </div>
                      </div>
                    </td>
                    <td className="cell-type">
                      <span className="type-tag">{sig.typeTravauxLibelle || '-'}</span>
                    </td>
                    <td className="cell-status">
                      <span className={`status-badge ${getStatusBadgeClass(sig.etatLibelle, sig.etatActuelId)}`}>
                        {getStatusIcon(sig.etatLibelle)} {sig.etatLibelle || 'Inconnu'}
                      </span>
                    </td>
                    <td className="cell-surface">
                      <div className="surface-value">
                        {sig.surfaceMetreCarree?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="cell-date">
                      {new Date(sig.dateCreation).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-container">
                        <button
                          className="action-button action-view"
                          onClick={() => handleRowClick(sig.idSignalement)}
                        >
                          Voir
                        </button>
                        <button
                          className="action-button action-delete"
                          onClick={() => handleDelete(sig.idSignalement, sig.titre)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              className="pagination-button prev"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Précédent
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                if (pageNum < 1 || pageNum > totalPages) return null

                return (
                  <button
                    key={pageNum}
                    className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              className="pagination-button next"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant →
            </button>
          </div>
          
          <div className="pagination-info">
            <span className="pagination-text">
              Page {currentPage} sur {totalPages} • {total} signalement{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}