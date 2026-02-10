import { useState, useEffect } from 'react'
import MapLibreMap from './MapLibreMap'
import '../styles/visitor.css'
import { useAuth, getAuthHeaders } from '../hooks/useAuth'

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

export default function MapOnlyPage() {
  const { isAuthenticated } = useAuth()
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)
  const [mySignalementsOnly, setMySignalementsOnly] = useState(false)

  useEffect(() => {
    loadSignalements()
  }, [mySignalementsOnly])

  async function loadSignalements() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' })
      if (mySignalementsOnly) params.append('mySignalements', 'true')
      
      const headers: HeadersInit = mySignalementsOnly ? getAuthHeaders() : {}
      const res = await fetch(`/api/signalements/visiteur?${params}`, { headers })
      if (!res.ok) throw new Error('Erreur chargement signalements')
      const data = await res.json()
      setSignalements(data.items || [])
    } catch (e) {
      console.warn('Erreur chargement signalements:', e)
      setSignalements([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="visitor-container">
      <div className="visitor-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="visitor-title">Carte des signalements</h1>
            <p className="visitor-subtitle">Affichage de la carte avec les points signalés</p>
          </div>
          <div className="header-stats-section">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                    onChange={(e) => setMySignalementsOnly(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  📍 Mes signalements
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
                  🔒 Connectez-vous
                </div>
              )}
              <button className="retry-button" onClick={loadSignalements} disabled={loading}>
                {loading ? 'Chargement…' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ height: '70vh', borderRadius: 12, overflow: 'hidden' }}>
          <MapLibreMap signalements={signalements} selectedId={null} onMarkerClick={() => {}} />
        </div>
      </div>
    </div>
  )
}
