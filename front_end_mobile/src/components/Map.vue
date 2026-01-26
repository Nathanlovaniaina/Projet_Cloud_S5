<template>
  <div ref="mapContainer" id="map" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onIonViewDidEnter } from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '@/composables/useGeolocation';
import { db } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;

export interface Props {
  isCreating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCreating: false
});

const emit = defineEmits<{
  locationSelected: [location: { lat: number; lng: number }];
}>();

let temporaryMarker: L.Marker | null = null;

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

async function loadSignalements() {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'signalements')));
    
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const { latitude, longitude, description, titre } = data;
      
      L.circleMarker([latitude, longitude], {
        radius: 6,
        color: '#2196F3',
        weight: 2,
        fillOpacity: 0.7
      }).bindPopup(`<strong>${titre || 'Signalement'}</strong><br/>${description}`).addTo(map!);
    });
  } catch (error) {
    console.error('Erreur chargement signalements:', error);
  }
}

onMounted(async () => {
  if (map || !mapContainer.value) return;

  // Force explicit dimensions before map init
  mapContainer.value.style.height = '100%';
  mapContainer.value.style.width = '100%';

  map = L.map(mapContainer.value, {
    center: [-18.8792, 47.5079],
    zoom: 13,
    zoomControl: true,
    preferCanvas: true,
    tap: true,
    touchZoom: true,
    inertia: true
  });

  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    updateWhenIdle: true,
    updateWhenZooming: false,
    reuseTiles: true,
    keepBuffer: 2
  }).addTo(map);

  tiles.on('loading', () => {
    // placeholder for loader
  });
  tiles.on('load', () => {
    // placeholder for hiding loader
  });

  // Force size recalculation immediately
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 50);

  // Récupérer position de l'utilisateur et ajouter marker
  const pos = await getCurrentPosition();
  if (pos && map) {
    L.circleMarker([pos.lat, pos.lng], {
      radius: 8,
      color: '#4CAF50',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).bindPopup('Ma position').addTo(map);
    
    // Centrer sur l'utilisateur
    map.setView([pos.lat, pos.lng], 15);
  }

  // Charger les signalements existants
  await loadSignalements();

  // Au clic sur la carte
  map.on('click', (e) => {
    if (props.isCreating) {
      // Supprimer le marker temporaire précédent
      if (temporaryMarker) {
        map!.removeLayer(temporaryMarker);
      }

      // Créer un nouveau marker temporaire
      temporaryMarker = L.marker([e.latlng.lat, e.latlng.lng])
        .bindPopup('Nouveau signalement')
        .addTo(map!)
        .openPopup();

      // Émettre la localisation
      emit('locationSelected', { lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
});

onIonViewDidEnter(() => {
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 100);
});

// Listen to window resize events too
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  });
}

// Exposer les fonctions
defineExpose({ 
  refreshSignalements: loadSignalements
});
</script>

<style scoped>
.map-container {
  display: block;
  height: 100%;
  width: 100%;
  position: relative;
}

#map {
  display: block;
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
