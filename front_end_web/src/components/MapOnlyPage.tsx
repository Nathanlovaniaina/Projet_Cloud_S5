import { useState, useEffect } from 'react'
import MapLibreMap from './MapLibreMap'
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

export default function MapOnlyPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSignalements()
  }, [])

  async function loadSignalements() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' })
      const res = await fetch(`/api/signalements/visiteur?${params}`)
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
            <div style={{ display: 'flex', gap: 8 }}>
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
