import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet's default icon paths when using Vite
const defaultIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

const selectedIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -48],
  tooltipAnchor: [16, -38],
  shadowSize: [57, 57],
  className: 'selected-marker'
})

L.Marker.prototype.options.icon = defaultIcon

interface Signalement {
  idSignalement: number
  titre: string
  description: string
  latitude: number
  longitude: number
  dateCreation: string
  etatLibelle?: string
  typeTravauxLibelle?: string
}

interface LeafletMapProps {
  signalements?: Signalement[]
  selectedId?: number | null
  onMarkerClick?: (id: number) => void
}

// Composant pour centrer la carte sur un marker sélectionné
function MapController({ selectedId, signalements }: { selectedId?: number | null, signalements?: Signalement[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (selectedId && signalements) {
      const selected = signalements.find(s => s.idSignalement === selectedId)
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 16, {
          duration: 1
        })
      }
    }
  }, [selectedId, signalements, map])
  
  return null
}

export default function LeafletMap({ signalements = [], selectedId = null, onMarkerClick }: LeafletMapProps) {
  const center: [number, number] = [-18.8792, 47.5079] // Antananarivo
  
  // Use OpenStreetMap online tiles directly (reliable)
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url={tileUrl} 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController selectedId={selectedId} signalements={signalements} />
        
        {signalements && signalements.length > 0 ? (
          signalements.map((sig) => (
            <Marker 
              key={sig.idSignalement}
              position={[sig.latitude, sig.longitude]}
              icon={selectedId === sig.idSignalement ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => onMarkerClick?.(sig.idSignalement)
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>
                    {sig.titre || 'Sans titre'}
                  </h3>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>
                    <strong>Type:</strong> {sig.typeTravauxLibelle || '-'}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>
                    <strong>Statut:</strong> {sig.etatLibelle || 'Inconnu'}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>
                    <strong>Date:</strong> {new Date(sig.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {sig.description?.substring(0, 100)}{sig.description && sig.description.length > 100 ? '...' : ''}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))
        ) : (
          <Marker position={center}>
            <Popup>Antananarivo - Aucun signalement</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
