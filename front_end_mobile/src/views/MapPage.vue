<template>
  <ion-page class="map-page">
    <!-- Map Component -->
    <div class="map-wrapper">
      <Map 
        ref="mapRef" 
        :filter-my-signalements="filterMySignalements"
      />
      
      <!-- Filtre flottant en haut à droite -->
      <div class="filter-button-container">
        <ion-button 
          class="filter-button"
          :class="{ 'filter-active': filterMySignalements }"
          @click="toggleFilter"
          shape="round"
        >
          <ion-icon slot="icon-only" :icon="filterIcon"></ion-icon>
        </ion-button>
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/vue';
import { funnel as filterIcon } from 'ionicons/icons';
import Map from '@/components/Map.vue';

const mapRef = ref<any>(null);
const filterMySignalements = ref(false);

function toggleFilter() {
  filterMySignalements.value = !filterMySignalements.value;
}
</script>

<style scoped>
ion-page {
  display: block;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map-page {
  width: 100%;
  height: 100%;
}

.map-wrapper {
  width: 100%;
  height: calc(100vh - 80px);
  position: relative;
  overflow: hidden;
}

.filter-button-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: auto;
}

.filter-button {
  --background: rgba(255, 255, 255, 0.95);
  --color: var(--ion-color-dark);
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 50px;
  height: 50px;
  transition: all 0.3s ease;
  --border-radius: 50%;
}

.filter-button:hover {
  --box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.filter-button.filter-active {
  --background: var(--ion-color-primary);
  --color: white;
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@media (max-width: 768px) {
  .filter-button-container {
    top: 12px;
    right: 12px;
  }

  .filter-button {
    width: 46px;
    height: 46px;
    font-size: 20px;
  }

  .map-wrapper {
    height: calc(100vh - 70px);
  }
}

@media (prefers-color-scheme: dark) {
  .filter-button {
    --background: rgba(30, 30, 30, 0.95);
    --color: white;
  }
}
</style>
