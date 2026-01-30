import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../styles/map.css'

interface Signalement {
  idSignalement: number
  titre?: string
  description?: string
  latitude: number
  longitude: number
  dateCreation?: string
  etatLibelle?: string
  typeTravauxLibelle?: string
  etatActuelId?: number
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
  const [etatOptions, setEtatOptions] = useState<{idEtatSignalement: number, libelle: string}[]>([])

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

  // Fonction pour déterminer la couleur du marqueur selon l'état
  const getMarkerColor = (etatLibelle?: string, etatActuelId?: number) => {
    const etat = etatLibelle?.toLowerCase() || ''
    
    // Priorité aux libellés
    if (etat.includes('en attente') || etat.includes('attente')) {
      return '#f59e0b' // Orange
    }
    if (etat.includes('accepté') || etat.includes('accepte')) {
      return '#3b82f6' // Bleu
    }
    if (etat.includes('refusé') || etat.includes('refuse') || etat.includes('rejet')) {
      return '#ef4444' // Rouge (Rejeté / Refusé)
    }
    if (etat.includes('en cours') || etat.includes('cours')) {
      return '#8b5cf6' // Violet (En cours)
    }
    if (etat.includes('résolu') || etat.includes('resolu') || etat.includes('terminé') || etat.includes('termine') || etat.includes('terminée')) {
      return '#10b981' // Vert (Résolu / Terminé)
    }
    
    // Fallback sur les ID d'état
    switch (etatActuelId) {
      case 1: return '#f59e0b' // En attente
      case 2: return '#8b5cf6' // En cours
      case 3: return '#10b981' // Résolu
      case 4: return '#ef4444' // Rejeté
      default: return '#666666' // Gris par défaut
    }
  }

  // Fonction pour déterminer la classe CSS du badge selon l'état
  const getStatusBadgeClass = (etatLibelle?: string) => {
    const etat = etatLibelle?.toLowerCase() || ''
    
    if (etat.includes('en attente') || etat.includes('attente')) {
      return 'status-pending'
    }
    if (etat.includes('accepté') || etat.includes('accepte')) {
      return 'status-accepted'
    }
    if (etat.includes('refusé') || etat.includes('refuse') || etat.includes('rejet')) {
      return 'status-refused'
    }
    if (etat.includes('en cours') || etat.includes('cours')) {
      return 'status-inprogress'
    }
    if (etat.includes('résolu') || etat.includes('resolu') || etat.includes('terminé') || etat.includes('termine') || etat.includes('terminée')) {
      return 'status-completed'
    }
    return 'status-unknown'
  }

  // Fonction pour obtenir l'icône de l'état
  const getStatusIcon = (etatLibelle?: string) => {
    const etat = etatLibelle?.toLowerCase() || ''
    
    if (etat.includes('en attente') || etat.includes('attente')) {
      return '⏳'
    }
    if (etat.includes('accepté') || etat.includes('accepte')) {
      return '✅'
    }
    if (etat.includes('refusé') || etat.includes('refuse') || etat.includes('rejet')) {
      return '❌'
    }
    if (etat.includes('en cours') || etat.includes('cours')) {
      return '🚧'
    }
    if (etat.includes('résolu') || etat.includes('resolu') || etat.includes('terminé') || etat.includes('termine') || etat.includes('terminée')) {
      return '🏁'
    }
    return '❓'
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
            zoom: ZOOM,
            attributionControl: false
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
          zoom: ZOOM,
          attributionControl: false
        })
        setStatus('fallback')
      })
      .finally(() => {
        if (map.current) {
          const navControl = new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
          })
          map.current.addControl(navControl, 'top-left')
          
          const scaleControl = new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
          })
          map.current.addControl(scaleControl, 'bottom-left')
          
          const attributionControl = new maplibregl.AttributionControl({
            compact: true,
            customAttribution: '© Signalement ROUE'
          })
          map.current.addControl(attributionControl, 'bottom-right')
        }
      })

    return () => {
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
        el.className = 'map-marker'
        
        // Obtenir la couleur selon l'état
        const markerColor = getMarkerColor(sig.etatLibelle, sig.etatActuelId)
        const isSelected = selectedId === sig.idSignalement
        const markerSize = isSelected ? '32px' : '24px'
        const borderWidth = isSelected ? '3px' : '2px'
        
        el.innerHTML = `
          <div class="marker-content" style="
            width: ${markerSize}; 
            height: ${markerSize};
            background: ${markerColor};
            border: ${borderWidth} solid white;
          ">
            <span class="marker-icon">${getStatusIcon(sig.etatLibelle)}</span>
          </div>
        `

        const marker = new maplibregl.Marker({ 
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([sig.longitude, sig.latitude])
          .addTo(map.current!)

        // Ajouter une classe si sélectionné
        if (isSelected) {
          el.classList.add('selected')
        }

        // lightweight preview popup on hover
        const previewPopup = new maplibregl.Popup({ 
          offset: 8, 
          closeButton: false, 
          closeOnClick: false,
          className: 'map-popup map-preview-popup'
        })

        el.addEventListener('mouseenter', () => {
          try { 
            previewPopup
              .setLngLat([sig.longitude, sig.latitude])
              .setHTML(`
                <div class="popup-preview">
                  <div class="popup-title">${sig.titre || 'Sans titre'}</div>
                  <div class="popup-meta">
                    <span class="status-badge ${getStatusBadgeClass(sig.etatLibelle)}">
                      ${sig.etatLibelle || 'Inconnu'}
                    </span>
                    <span class="popup-type">${sig.typeTravauxLibelle || '-'}</span>
                  </div>
                </div>
              `)
              .addTo(map.current!) 
          } catch (e) {}
        })
        el.addEventListener('mouseleave', () => {
          try { previewPopup.remove() } catch (e) {}
        })

        // on click fetch detailed info lazily and show in popup
        el.addEventListener('click', async () => {
          onMarkerClick?.(sig.idSignalement)

          // remove previous popup if any
          try { popupRef.current?.remove() } catch(e) {}

          // create loading popup
          const loadingPopup = new maplibregl.Popup({ 
            offset: 12, 
            closeOnClick: false,
            className: 'map-popup map-detail-popup',
            maxWidth: '400px'
          })
            .setLngLat([sig.longitude, sig.latitude])
            .setHTML(`
              <div class="popup-loading">
                <div class="loading-spinner-small"></div>
                <div>Chargement des détails...</div>
              </div>
            `)
            .addTo(map.current!)
          popupRef.current = loadingPopup

          try {
            const res = await fetch(`/api/signalements/${sig.idSignalement}/details`)
            if (!res.ok) throw new Error('Network response not ok')
            const api = await res.json()
            const data = api?.data || api

            // format creation date
            let createdAt = ''
            try { 
              createdAt = data.dateCreation ? new Date(data.dateCreation).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '' 
            } catch(e) { createdAt = data.dateCreation || '' }

            // Assignations
            const assignationsHtml = (data.assignations || []).map((a: any) => `
              <div class="assignation-item">
                <div class="assignation-title">${a.nomEntreprise || 'Entreprise'}</div>
                <div class="assignation-details">
                  <span>Statut: ${a.statutLibelle || '-'}</span>
                  <span>Période: ${a.dateDebut || '-'} → ${a.dateFin || '-'}</span>
                  <span>Montant: ${a.montant != null ? `${a.montant}€` : '-'}</span>
                </div>
              </div>
            `).join('') || '<div class="no-data">Aucune assignation</div>'

            // Historique
            const historyHtml = (data.historiqueEtat || []).slice(0,5).map((h: any) => {
              let dateStr = ''
              try { 
                dateStr = h.dateChangement ? new Date(h.dateChangement).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '' 
              } catch(e) { dateStr = h.dateChangement || '' }
              return `
                <div class="history-item">
                  <div class="history-status">${h.libelle || '-'}</div>
                  <div class="history-date">${dateStr}</div>
                </div>
              `
            }).join('') || '<div class="no-data">Aucun historique</div>'

            const html = `
              <div class="popup-detail">
                <div class="popup-header">
                  <div class="popup-id">Signalement #${sig.idSignalement}</div>
                  <h3 class="popup-title-large">${data.titre || sig.titre || 'Sans titre'}</h3>
                  <div class="popup-meta-large">
                    <span class="popup-date">Créé le ${createdAt}</span>
                    <span class="popup-progress">Progression: ${data.progressionPercent ?? '-'}%</span>
                  </div>
                </div>
                
                <div class="popup-content">
                  <div class="popup-section">
                    <div class="section-title">Description</div>
                    <div class="section-content">${data.description || sig.description || 'Aucune description'}</div>
                  </div>
                  
                  <div class="popup-section">
                    <div class="section-title">État actuel</div>
                    <div class="status-badge ${getStatusBadgeClass(data.currentEtatLibelle || sig.etatLibelle)}">
                      ${getStatusIcon(data.currentEtatLibelle || sig.etatLibelle)} 
                      ${data.currentEtatLibelle || sig.etatLibelle || '-'}
                    </div>
                  </div>
                  
                  <div class="popup-section">
                    <div class="section-title">Type de travaux</div>
                    <div class="section-content">
                      <span class="type-tag">${data.typeTravauxLibelle || sig.typeTravauxLibelle || '-'}</span>
                    </div>
                  </div>
                  
                  <div class="popup-section">
                    <div class="section-title">Assignations</div>
                    <div class="section-content assignations-list">
                      ${assignationsHtml}
                    </div>
                  </div>
                  
                  <div class="popup-section">
                    <div class="section-title">Historique récent</div>
                    <div class="section-content history-list">
                      ${historyHtml}
                    </div>
                  </div>
                </div>
              </div>
            `

            loadingPopup.setHTML(html)
            popupRef.current = loadingPopup
          } catch (err) {
            try { 
              loadingPopup.setHTML(`
                <div class="popup-error">
                  <div class="error-icon">⚠️</div>
                  <div class="error-text">Erreur lors du chargement des détails</div>
                  <div class="error-hint">Veuillez réessayer plus tard</div>
                </div>
              `) 
            } catch(e){}
          }
        })

        markersRef.current.push(marker)
      } catch (e) {
        console.warn('Erreur ajout marker', e)
      }
    })
  }, [signalements, onMarkerClick, selectedId])

  // Center on selected marker
  useEffect(() => {
    if (!map.current || selectedId == null) return
    const sel = signalements.find(s => s.idSignalement === selectedId)
    if (sel) {
      map.current.flyTo({ 
        center: [sel.longitude, sel.latitude], 
        zoom: 16, 
        speed: 1.2,
        curve: 1.42
      })
    }
  }, [selectedId, signalements])

  // Charger les états depuis l'API et construire la légende dynamiquement
  useEffect(() => {
    fetch('/api/signalements/etats')
      .then(res => res.ok ? res.json() : Promise.reject('no-states'))
      .then((data: any[]) => {
        const normalized = (data || []).map(item => ({
          idEtatSignalement: item.idEtatSignalement ?? item.id ?? item.Id_etat_signalement ?? null,
          libelle: item.libelle ?? item.nomEtat ?? item.nom ?? ''
        })).filter(i => i.idEtatSignalement != null)
        setEtatOptions(normalized as {idEtatSignalement:number, libelle:string}[])
      })
      .catch(() => setEtatOptions([]))
  }, [])

  const defaultLegendItems = [
    { label: 'En attente', color: '#f59e0b', icon: '⏳' },
    { label: 'En cours', color: '#8b5cf6', icon: '🚧' },
    { label: 'Résolu', color: '#10b981', icon: '🏁' },
    { label: 'Rejeté', color: '#ef4444', icon: '❌' }
  ]

  const legendItems = etatOptions.length > 0
    ? etatOptions.map(e => ({ label: e.libelle, color: getMarkerColor(undefined, e.idEtatSignalement), icon: getStatusIcon(e.libelle) }))
    : defaultLegendItems

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map-viewport" />
      
      {/* Status indicator */}
      <div className={`map-status ${status}`}>
        {status === 'loading' && '⏳ Chargement de la carte...'}
        {status === 'local' && '🗺️ Mode local'}
        {status === 'fallback' && '🌐 Mode en ligne'}
      </div>
      
      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Légende des états</div>
        <div className="legend-items">
          {legendItems.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </div>
              <div className="legend-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}