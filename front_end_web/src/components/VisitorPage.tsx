import { useState, useEffect } from 'react'
import MapLibreMap from './MapLibreMap'
import RecapTable from './RecapTable'
import '../styles/visitor.css'

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

export default function VisitorPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination & filtres
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [typeFilter, setTypeFilter] = useState<number | undefined>()
  const [statusOptions, setStatusOptions] = useState<{idEtatSignalement: number, libelle: string}[]>([])
  const [typeOptions, setTypeOptions] = useState<{idTypeTravail: number, libelle: string}[]>([])

  useEffect(() => {
    loadSignalements()
  }, [currentPage, statusFilter, typeFilter])

  useEffect(() => {
    loadFilterOptions()
  }, [])

  // load public summary statistics for visitors
  const [summary, setSummary] = useState<{ totalSignalements?: number, signalementsEnAttente?: number, signalementsEnCours?: number, signalementsTermines?: number } | null>(null)
  const [byType, setByType] = useState<any[]>([])
  const [byState, setByState] = useState<any[]>([])

  useEffect(() => {
    loadPublicSummary()
  }, [])

  async function loadPublicSummary() {
    try {
      const [summaryRes, typeRes, stateRes] = await Promise.all([
        fetch('/api/signalements/summary-public'),
        fetch('/api/signalements/stats-by-type-public'),
        fetch('/api/signalements/stats-by-state-public')
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (typeRes.ok) setByType(await typeRes.json())
      if (stateRes.ok) setByState(await stateRes.json())
    } catch (e) {
      console.warn('Erreur chargement résumé public', e)
    }
  }

  async function loadFilterOptions() {
    try {
      const [statusRes, typeRes] = await Promise.all([
        fetch('/api/signalements/etats'),
        fetch('/api/signalements/types')
      ])
      
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatusOptions(statusData)
      }
      
      if (typeRes.ok) {
        const typeData = await typeRes.json()
        setTypeOptions(typeData)
      }
    } catch (err) {
      console.warn('Erreur chargement options filtres:', err)
    }
  }

  async function loadSignalements() {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (statusFilter) params.append('status', statusFilter.toString())
      if (typeFilter) params.append('type', typeFilter.toString())
      
      const response = await fetch(`/api/signalements/visiteur?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des signalements')
      }
      
      const data: PaginatedResponse = await response.json()
      
      setSignalements(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.page || 1)
      
      // Cache pour mode hors ligne
      try {
        localStorage.setItem('cachedSignalements', JSON.stringify(data.items))
      } catch (e) {
        console.warn('Impossible de mettre en cache les signalements', e)
      }
    } catch (err: any) {
      console.error('Erreur chargement signalements:', err)
      setError(err.message)
      
      // Tenter de charger le cache
      try {
        const cached = localStorage.getItem('cachedSignalements')
        if (cached) {
          setSignalements(JSON.parse(cached))
          setError('Mode hors ligne - données en cache')
        }
      } catch (e) {
        console.warn('Impossible de charger le cache', e)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleMarkerClick(id: number) {
    setSelectedId(id)
  }

  function handleRowClick(id: number) {
    setSelectedId(id)
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading && signalements.length === 0) {
    return (
      <div className="visitor-container">
        <div className="visitor-loading">
          <p>Chargement des signalements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="visitor-container">
      <div className="visitor-header">
        <h1>Carte des Signalements - Antananarivo</h1>
        <p className="visitor-subtitle">
          {total} signalement{total !== 1 ? 's' : ''} enregistré{total !== 1 ? 's' : ''}
        </p>

        {summary && (
          <div className="visitor-stats">
            <div className="stat-card">
              <div className="stat-value">{summary.totalSignalements ?? total}</div>
              <div className="stat-label">Total signalements</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.signalementsEnAttente ?? 0}</div>
              <div className="stat-label">En attente</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.signalementsEnCours ?? 0}</div>
              <div className="stat-label">En cours</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.signalementsTermines ?? 0}</div>
              <div className="stat-label">Terminés</div>
            </div>
          </div>
        )}
      </div>

      {error && !signalements.length && (
        <div className="visitor-error">
          <p>⚠️ {error}</p>
          <button onClick={loadSignalements} className="retry-button">
            Réessayer
          </button>
        </div>
      )}

      {error && signalements.length > 0 && (
        <div className="visitor-warning">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="visitor-content">
        <div className="visitor-map-section">
          <MapLibreMap
            signalements={signalements}
            selectedId={selectedId}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        <div className="visitor-table-section">
          <RecapTable
            signalements={signalements}
            selectedId={selectedId}
            onRowClick={handleRowClick}
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
            onStatusFilter={setStatusFilter}
            onTypeFilter={setTypeFilter}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
          />
        </div>
      </div>
    </div>
  )
}
