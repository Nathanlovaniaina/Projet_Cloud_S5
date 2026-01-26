<template>
  <div ref="mapContainer" id="map" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onIonViewDidEnter } from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

onMounted(() => {
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
