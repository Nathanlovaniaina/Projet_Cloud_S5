import { useState, useEffect } from 'react'
import MapLibreMap from './MapLibreMap'
import RecapTable from './RecapTable'
import '../styles/visitor.css'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend as ReLegend
} from 'recharts'

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
    const [summary, setSummary] = useState<any | null>(null)
  const [byType, setByType] = useState<any[]>([])
  const [byState, setByState] = useState<any[]>([])

  useEffect(() => {
    loadPublicSummary()
  }, [])

  const COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#3b82f6', '#666666']

  async function loadPublicSummary() {
    try {
      const [summaryRes, typeRes, stateRes] = await Promise.all([
        fetch('/api/signalements/summary-public'),
        fetch('/api/signalements/stats-by-type-public'),
        fetch('/api/signalements/stats-by-state-public')
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())

      // Map backend response shape to the UI-friendly shape used below
      if (typeRes.ok) {
        const typeData: any[] = await typeRes.json()
        setByType(
          typeData.map(item => ({
            count: item.total ?? item.count ?? 0,
            type: item.nomType ?? item.type ?? 'Non spécifié'
          }))
        )
      }

      if (stateRes.ok) {
        const stateData: any[] = await stateRes.json()
        setByState(
          stateData.map(item => ({
            count: item.total ?? item.count ?? 0,
            etat: item.nomEtat ?? item.libelle ?? item.etat ?? 'Non spécifié'
          }))
        )
      }
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
          <div className="loading-spinner"></div>
          <p>Chargement des signalements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="visitor-container">
      <div className="visitor-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="visitor-title">Signalements de Roues Abîmées</h1>
            <p className="visitor-subtitle">
              {total} signalement{total !== 1 ? 's' : ''} enregistré{total !== 1 ? 's' : ''} sur Antananarivo
            </p>
          </div>
          
          <div className="header-stats-section">
            {summary && (
              <div className="visitor-stats">
                <div className="stat-card">
                  <div className="stat-value">{summary.totalSignalements ?? total}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value status-waiting">{summary.signalementsEnAttente ?? 0}</div>
                  <div className="stat-label">En attente</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value status-inprogress">{summary.signalementsEnCours ?? 0}</div>
                  <div className="stat-label">En cours</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value status-done">{summary.signalementsTermines ?? 0}</div>
                  <div className="stat-label">Terminés</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && !signalements.length && (
        <div className="visitor-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={loadSignalements} className="retry-button">
              Réessayer
            </button>
          </div>
        </div>
      )}

      {error && signalements.length > 0 && (
        <div className="visitor-warning">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="visitor-content">
        <div className="visitor-main-section">
          <div className="map-container">
            <div className="map-header">
              <h2 className="section-title">Carte des Signalements</h2>
              <p className="section-subtitle">Cliquez sur un marqueur pour voir les détails</p>
            </div>
            <div className="map-wrapper">
              <MapLibreMap
                signalements={signalements}
                selectedId={selectedId}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </div>

          <div className="table-container">
            <div className="table-wrapper">
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

        {(summary || byType.length > 0 || byState.length > 0) && (
          <div className="visitor-advanced-stats">
            <h2 className="section-title">Statistiques avancées</h2>

            {summary && (
              <div className="stats-section">
                <h3>Résumé détaillé</h3>
                <div className="stats-grid">
                  <div className="advanced-stat-card">
                    <div className="advanced-stat-value">{(summary.tauxCompletionMoyen ?? 0).toFixed ? (summary.tauxCompletionMoyen ?? 0).toFixed(1) : summary.tauxCompletionMoyen}</div>
                    <div className="advanced-stat-label">Taux compl. moyen (%)</div>
                  </div>
                  <div className="advanced-stat-card">
                    <div className="advanced-stat-value">{(summary.tauxPonctualiteMoyen ?? 0).toFixed ? (summary.tauxPonctualiteMoyen ?? 0).toFixed(1) : summary.tauxPonctualiteMoyen}</div>
                    <div className="advanced-stat-label">Taux ponct. moyen (%)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 320px', minWidth: 280, height: 240 }}>
                    <h4>Répartition par état</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byState.map(s => ({ name: s.etat, value: s.count }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {byState.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                        <ReLegend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ flex: '1 1 420px', minWidth: 320, height: 240 }}>
                    <h4>Répartition par type de travaux</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byType.map(t => ({ name: t.type, value: t.count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip />
                        <ReLegend />
                        <Bar dataKey="value" fill="#3b82f6">
                          {byType.map((entry, idx) => (
                            <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {summary.top5Entreprises && summary.top5Entreprises.length > 0 && (
                  <div className="top-enterprises" style={{ marginTop: 16 }}>
                    <h4 className="section-subtitle">Top entreprises</h4>
                    <div className="enterprise-grid">
                      {summary.top5Entreprises.map((ent: any, i: number) => {
                        const assigned = Number(ent.tachesAssignees ?? 0)
                        const finished = Number(ent.tachesTerminees ?? 0)
                        const pct = assigned > 0 ? Math.round((finished / assigned) * 100) : 0
                        return (
                          <div key={i} className="enterprise-card">
                            <div className="enterprise-left">
                              <div className="enterprise-name">{ent.nomEntreprise}</div>
                              <div className="enterprise-metrics">{assigned} assignées • {finished} terminées</div>
                            </div>
                            <div className="enterprise-right">
                              <div className="enterprise-stats">
                                <div className="enterprise-stat">
                                  <div className="enterprise-stat-value">{assigned}</div>
                                  <div className="enterprise-stat-label">Assignées</div>
                                </div>
                                <div className="enterprise-stat">
                                  <div className="enterprise-stat-value">{finished}</div>
                                  <div className="enterprise-stat-label">Terminées</div>
                                </div>
                              </div>
                              <div className="enterprise-progress" aria-hidden>
                                <div className="enterprise-progress-bar" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="enterprise-progress-label">{pct}%</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {byType.length > 0 && (
              <div className="stats-section">
                <h3>Répartition par type de travaux</h3>
                <div className="stats-grid">
                  {byType.map((item, index) => (
                    <div key={index} className="advanced-stat-card">
                      <div className="advanced-stat-value">{item.count}</div>
                      <div className="advanced-stat-label">{item.type || 'Non spécifié'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {byState.length > 0 && (
              <div className="stats-section">
                <h3>Répartition par état</h3>
                <div className="stats-grid">
                  {byState.map((item, index) => (
                    <div key={index} className="advanced-stat-card">
                      <div className="advanced-stat-value">{item.count}</div>
                      <div className="advanced-stat-label">{item.etat || 'Non spécifié'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}