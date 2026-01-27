import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Signalement {
  idSignalement: number
  titre?: string
  description?: string
  latitude: number
  longitude: number
  dateCreation?: string
  etatLibelle?: string
  typeTravauxLibelle?: string
}

interface Props {
  signalements?: Signalement[]
  selectedId?: number | null
  onMarkerClick?: (id: number) => void
}

export default function MapLibreMap({ signalements = [], selectedId = null, onMarkerClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [status, setStatus] = useState<'loading' | 'local' | 'fallback'>('loading')

  const CENTER: [number, number] = [47.5079, -18.8792] // [lng, lat] Antananarivo
  const ZOOM = 13

  // Local tileserver style URL (vector tiles)
  const LOCAL_STYLE = 'http://localhost:8081/styles/osm-bright/style.json'
  
  // Fallback to OSM raster tiles if local server unavailable
  const FALLBACK_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
      'osm-raster': {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: 'osm-raster-layer',
        type: 'raster',
        source: 'osm-raster',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Try local tileserver first
    fetch(LOCAL_STYLE, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          map.current = new maplibregl.Map({
            container: mapContainer.current!,
            style: LOCAL_STYLE,
            center: CENTER,
            zoom: ZOOM
          })
          setStatus('local')
        } else {
          throw new Error('Local tileserver not available')
        }
      })
      .catch(() => {
        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: FALLBACK_STYLE,
          center: CENTER,
          zoom: ZOOM
        })
        setStatus('fallback')
      })
      .finally(() => {
        if (map.current) {
          map.current.addControl(new maplibregl.NavigationControl(), 'top-left')
        }
      })

    return () => {
      // cleanup map and markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when signalements change
  useEffect(() => {
    if (!map.current) return

    // remove existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // add markers
    signalements.forEach(sig => {
      try {
        const el = document.createElement('div')
        el.className = 'ml-marker'
        el.style.width = '18px'
        el.style.height = '18px'
        el.style.borderRadius = '50%'
        el.style.background = '#2563eb'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([sig.longitude, sig.latitude])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`
            <div style="min-width:200px; color:black;">
              <h3 style="margin:0 0 8px 0">${sig.titre || 'Sans titre'}</h3>
              <p style="margin:4px 0"><strong>Type:</strong> ${sig.typeTravauxLibelle || '-'}</p>
              <p style="margin:4px 0"><strong>Statut:</strong> ${sig.etatLibelle || 'Inconnu'}</p>
            </div>
          `))
          .addTo(map.current!)

        el.addEventListener('click', () => onMarkerClick?.(sig.idSignalement))
        markersRef.current.push(marker)
      } catch (e) {
        console.warn('Erreur ajout marker', e)
      }
    })
  }, [signalements, onMarkerClick])

  // Center on selected marker
  useEffect(() => {
    if (!map.current || selectedId == null) return
    const sel = signalements.find(s => s.idSignalement === selectedId)
    if (sel) {
      map.current.flyTo({ center: [sel.longitude, sel.latitude], zoom: 16, speed: 1.2 })
      // open popup for the matching marker (closest by position)
      const match = markersRef.current.find(m => {
        const lngLat = (m as any)._lngLat || (m as any).getLngLat && (m as any).getLngLat()
        if (!lngLat) return false
        return Math.abs(lngLat.lng - sel.longitude) < 0.000001 && Math.abs(lngLat.lat - sel.latitude) < 0.000001
      })
      if (match) {
        try { (match as any).togglePopup() } catch (e) {}
      }
    }
  }, [selectedId, signalements])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />

      {/* Status indicator */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 10,
        background: status === 'local' ? '#22c55e' : status === 'fallback' ? '#f59e0b' : '#6b7280',
        color: 'white',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'sans-serif',
        zIndex: 1000
      }}>
        {status === 'loading' && '⏳ Chargement...'}
        {status === 'local' && '🗺️ Tuiles locales (vectorielles)'}
        {status === 'fallback' && '🌐 OSM en ligne (fallback)'}
      </div>
    </div>
  )
}
