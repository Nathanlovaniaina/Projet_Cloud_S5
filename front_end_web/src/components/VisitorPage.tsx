import { useState, useEffect } from 'react'
import MapLibreMap from './MapLibreMap'
import RecapTable from './RecapTable'
import '../styles/visitor.css'
import { useAuth, getAuthHeaders } from '../hooks/useAuth'
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
  assignations?: Array<{
    nomEntreprise: string
    montant?: number
    statutLibelle?: string
  }>
  budgetTotal?: number
  budget?: number
  niveau?: number
  entrepriseConcernee?: string
}

interface PaginatedResponse {
  items: Signalement[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function VisitorPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
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
  const [mySignalementsOnly, setMySignalementsOnly] = useState(false)
  const [statusOptions, setStatusOptions] = useState<{idEtatSignalement: number, libelle: string}[]>([])
  const [typeOptions, setTypeOptions] = useState<{idTypeTravail: number, libelle: string}[]>([])

  useEffect(() => {
    loadSignalements()
  }, [currentPage, statusFilter, typeFilter, mySignalementsOnly])

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
      if (mySignalementsOnly) params.append('mySignalements', 'true')
      
      const headers: HeadersInit = mySignalementsOnly ? getAuthHeaders() : {}
      const response = await fetch(`/api/signalements/visiteur?${params}`, { headers })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des signalements')
      }
      
      const data: PaginatedResponse = await response.json()
      
      // Enrichir les signalements avec les données d'assignation
      const enrichedSignalements = await Promise.all(
        (data.items || []).map(async (sig) => {
          try {
            const detailRes = await fetch(`/api/signalements/${sig.idSignalement}/details`)
            if (detailRes.ok) {
              const detailApi = await detailRes.json()
              const detailData = detailApi?.data || detailApi
              
              return {
                ...sig,
                assignations: detailData.assignations || [],
                budget: detailData.budget || 0,
                niveau: detailData.niveau,
                entrepriseConcernee: detailData.assignations?.[0]?.nomEntreprise || undefined
              }
            }
          } catch (e) {
            console.warn(`Erreur chargement détails signalement ${sig.idSignalement}:`, e)
          }
          return sig
        })
      )
      
      setSignalements(enrichedSignalements)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.page || 1)
      
      // Cache pour mode hors ligne
      try {
        localStorage.setItem('cachedSignalements', JSON.stringify(enrichedSignalements))
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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: '8px 16px',
                  background: mySignalementsOnly ? '#3b82f6' : '#f3f4f6',
                  color: mySignalementsOnly ? 'white' : '#374151',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: mySignalementsOnly ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={mySignalementsOnly}
                    onChange={(e) => {
                      setMySignalementsOnly(e.target.checked)
                      setCurrentPage(1)
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                   Mes signalements uniquement
                </label>
              ) : (
                <div style={{
                  padding: '8px 16px',
                  background: '#f9fafb',
                  color: '#6b7280',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: '1px dashed #d1d5db'
                }}>
                  Connectez-vous pour voir vos signalements
                </div>
              )}
            </div>
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
          <p>{error}</p>
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
        </div>

        <div className="table-section">
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

        {(summary || byType.length > 0 || byState.length > 0) && (
          <div className="visitor-advanced-stats">
            <h2 className="section-title">Statistiques avancées</h2>

            {summary && (
              <div className="stats-section">

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