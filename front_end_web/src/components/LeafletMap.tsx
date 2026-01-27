import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default function LeafletMap() {
  const center: [number, number] = [-18.8792, 47.5079]
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Marker position={center}>
          <Popup>Antananarivo</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
