import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function MapLibreMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
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

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Try local tileserver first
    fetch(LOCAL_STYLE, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          // Local tileserver available - use vector tiles
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
        // Fallback to OSM raster
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
          // Add navigation controls
          map.current.addControl(new maplibregl.NavigationControl(), 'top-left')

          // Add marker for Antananarivo
          new maplibregl.Marker({ color: '#3b82f6' })
            .setLngLat(CENTER)
            .setPopup(new maplibregl.Popup().setHTML('<strong>Antananarivo</strong>'))
            .addTo(map.current)
        }
      })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
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
