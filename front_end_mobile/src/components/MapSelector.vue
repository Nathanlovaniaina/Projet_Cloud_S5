<template>
  <div ref="mapContainer" id="map-selector" class="map-selector-container"></div>
  <div class="map-overlay">
    <div class="instruction-banner">
      <ion-icon :icon="informationCircleIcon" class="info-icon"></ion-icon>
      <span>Cliquez sur la carte pour sélectionner une position</span>
    </div>
    <ion-button 
      v-if="selectedLocation"
      @click="confirmLocation"
      class="confirm-button"
      color="primary"
    >
      <ion-icon slot="start" :icon="checkmarkIcon"></ion-icon>
      Confirmer cette position
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { checkmark as checkmarkIcon, informationCircle as informationCircleIcon } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '@/composables/useGeolocation';

const emit = defineEmits<{
  locationSelected: [location: { lat: number; lng: number }];
}>();

const mapContainer = ref<HTMLElement | null>(null);
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);
let map: any = null;
let selectedMarker: any = null;

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

onMounted(async () => {
  if (!mapContainer.value) return;

  // Initialiser la carte
  map = L.map(mapContainer.value, {
    center: [-18.8792, 47.5079],
    zoom: 13,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Centrer sur la position de l'utilisateur
  const userPos = await getCurrentPosition();
  if (userPos && map) {
    map.setView([userPos.lat, userPos.lng], 15);
    
    // Ajouter un marker pour la position de l'utilisateur
    L.circleMarker([userPos.lat, userPos.lng], {
      radius: 8,
      color: '#4CAF50',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).bindPopup('Ma position').addTo(map);
  }

  // Gérer le clic sur la carte
  map.on('click', (e: any) => {
    // Supprimer le marker précédent s'il existe
    if (selectedMarker) {
      map.removeLayer(selectedMarker);
    }

    // Créer un nouveau marker
    selectedMarker = L.marker([e.latlng.lat, e.latlng.lng])
      .bindPopup('Position sélectionnée')
      .addTo(map)
      .openPopup();

    selectedLocation.value = { lat: e.latlng.lat, lng: e.latlng.lng };
  });

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 100);
});

function confirmLocation() {
  if (selectedLocation.value) {
    emit('locationSelected', selectedLocation.value);
  }
}
</script>

<style scoped>
.map-selector-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 16px;
}

.instruction-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.info-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}

.confirm-button {
  pointer-events: all;
  margin-top: auto;
  --border-radius: 12px;
  height: 56px;
  font-weight: 700;
  font-size: 16px;
  text-transform: none;
  box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4);
}

#map-selector {
  height: 100%;
  width: 100%;
}
</style>
