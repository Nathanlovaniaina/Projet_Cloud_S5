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
  const popupRef = useRef<maplibregl.Popup | null>(null)
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
          .addTo(map.current!)

        // lightweight preview popup on hover using available fields
        const previewPopup = new maplibregl.Popup({ offset: 8, closeButton: false, closeOnClick: false })
          .setHTML(`
            <div style="min-width:180px; color:black; font-family:sans-serif;">
              <strong>${sig.titre || 'Sans titre'}</strong>
              <div style="font-size:12px; margin-top:6px;">${sig.typeTravauxLibelle || '-'} · ${sig.etatLibelle || 'Inconnu'}</div>
            </div>
          `)

        el.addEventListener('mouseenter', () => {
          try { previewPopup.setLngLat([sig.longitude, sig.latitude]).addTo(map.current!) } catch (e) {}
        })
        el.addEventListener('mouseleave', () => {
          try { previewPopup.remove() } catch (e) {}
        })

        // on click fetch detailed info lazily and show in popup
        el.addEventListener('click', async () => {
          onMarkerClick?.(sig.idSignalement)

          // remove previous popup if any
          try { popupRef.current?.remove() } catch(e) {}

          // create loading popup (keep open on map clicks)
          const loadingPopup = new maplibregl.Popup({ offset: 12, closeOnClick: false })
            .setLngLat([sig.longitude, sig.latitude])
            .setHTML(`<div style="min-width:260px; padding:8px; font-family:sans-serif;">Chargement…</div>`)
            .addTo(map.current!)
          popupRef.current = loadingPopup

          try {
            const res = await fetch(`/api/signalements/${sig.idSignalement}/details`)
            if (!res.ok) throw new Error('Network response not ok')
            const api = await res.json()
            const data = api?.data || api // support direct or wrapped responses

            // build html content
            const assignHtml = (data.assignations || []).map((a: any) => `
              <div style="border-top:1px solid #eee; padding-top:6px; margin-top:6px;">
                <div style="font-weight:600">${a.nomEntreprise || 'Entreprise'}</div>
                <div style="font-size:12px">Statut: ${a.statutLibelle || '-'}</div>
                <div style="font-size:12px">Période: ${a.dateDebut || '-'} → ${a.dateFin || '-'}</div>
                <div style="font-size:12px">Montant: ${a.montant != null ? a.montant : '-'}</div>
              </div>
            `).join('')

            const historyHtml = (data.historiqueEtat || []).slice(0,5).map((h: any) => {
              let dateStr = ''
              try { dateStr = h.dateChangement ? new Date(h.dateChangement).toLocaleString() : '' } catch(e) { dateStr = h.dateChangement || '' }
              return `
                <div style="font-size:12px; border-top:1px dashed #f0f0f0; padding-top:6px; margin-top:6px;">
                  <div style="font-weight:600">${h.libelle || '-'}</div>
                  <div style="font-size:11px; color:#666">${dateStr}</div>
                </div>
              `
            }).join('')

            // format creation date
            let createdAt = ''
            try { createdAt = data.dateCreation ? new Date(data.dateCreation).toLocaleString() : '' } catch(e) { createdAt = data.dateCreation || '' }

            const html = `
              <div style="min-width:300px; max-width:420px; color:#111; font-family:sans-serif;">
                <h3 style="margin:0 0 8px 0">${data.titre || sig.titre || 'Sans titre'}</h3>
                <div style="margin-bottom:8px;"><strong>État:</strong> ${data.currentEtatLibelle || sig.etatLibelle || '-' }
                  <span style="float:right">Progress: ${data.progressionPercent ?? '-'}%</span>
                </div>
                <div style="font-size:12px; color:#666; margin-bottom:6px">Créé: ${createdAt}</div>
                <div style="font-size:13px; margin-bottom:8px">${data.description || sig.description || ''}</div>
                <div style="margin-bottom:6px"><strong>Assignations</strong>${assignHtml || '<div style="font-size:12px;color:#666">Aucune</div>'}</div>
                <div style="margin-top:8px"><strong>Historique</strong>${historyHtml || '<div style="font-size:12px;color:#666">Aucun historique</div>'}</div>
              </div>
            `

            loadingPopup.setHTML(html)
            popupRef.current = loadingPopup
          } catch (err) {
            try { loadingPopup.setHTML(`<div style="min-width:220px;padding:8px;font-family:sans-serif;color:#900">Erreur chargement</div>`) } catch(e){}
          }
        })

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
