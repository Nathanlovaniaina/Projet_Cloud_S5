<template>
  <ion-page class="map-page">
    <!-- Navbar en haut -->
    <ion-header :translucent="true">
      <ion-toolbar class="map-toolbar">
        <ion-title class="map-title">Carte</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openFilterModal">
            <ion-icon slot="icon-only" :icon="filterIcon"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Map Component -->
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar class="map-toolbar">
          <ion-title size="large" class="map-title">Carte</ion-title>
        </ion-toolbar>
      </ion-header>
      <div class="map-wrapper">
        <Map 
          ref="mapRef" 
          :filter-statuses="activeFilters"
          :filter-my-signalements="filterMySignalements"
        />
      </div>
    </ion-content>

    <!-- Modal de filtres -->
    <ion-modal :is-open="isFilterModalOpen" @didDismiss="closeFilterModal">
      <div class="filter-modal">
        <div class="filter-header">
          <h2 class="filter-title">Filtrer les signalements</h2>
          <button class="close-button" @click="closeFilterModal">
            <ion-icon :icon="closeIcon"></ion-icon>
          </button>
        </div>
        
        <div class="filter-content">
          <div class="filter-item">
            <div class="filter-item-left">
              <span class="color-dot" style="background: #F59E0B;"></span>
              <span class="filter-label">En cours</span>
            </div>
            <ion-toggle 
              v-model="filters.enCours" 
              color="success"
            ></ion-toggle>
          </div>
          
          <div class="filter-item">
            <div class="filter-item-left">
              <span class="color-dot" style="background: #10B981;"></span>
              <span class="filter-label">Résolus</span>
            </div>
            <ion-toggle 
              v-model="filters.resolus" 
              color="success"
            ></ion-toggle>
          </div>
          
          <div class="filter-item">
            <div class="filter-item-left">
              <span class="color-dot" style="background: #3B82F6;"></span>
              <span class="filter-label">En attente</span>
            </div>
            <ion-toggle 
              v-model="filters.enAttente" 
              color="success"
            ></ion-toggle>
          </div>
          
          <div class="filter-item">
            <div class="filter-item-left">
              <span class="color-dot" style="background: #EF4444;"></span>
              <span class="filter-label">Rejeté</span>
            </div>
            <ion-toggle 
              v-model="filters.rejete" 
              color="success"
            ></ion-toggle>
          </div>
          
          <div class="filter-item">
            <div class="filter-item-left">
              <span class="color-dot" style="background: #6B7280;"></span>
              <span class="filter-label">Mes signalements uniquement</span>
            </div>
            <ion-toggle 
              v-model="filterMySignalements" 
              color="success"
            ></ion-toggle>
          </div>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonToggle
} from '@ionic/vue';
import { funnel as filterIcon, close as closeIcon } from 'ionicons/icons';
import Map from '@/components/Map.vue';

const router = useRouter();
const mapRef = ref<any>(null);
const isFilterModalOpen = ref(false);
const filterMySignalements = ref(false);

// État des filtres
const filters = ref({
  enAttente: true,
  enCours: true,
  resolus: true,
  rejete: true
});

// Calculer les statuts actifs pour le filtre
const activeFilters = computed(() => {
  const active: string[] = [];
  if (filters.value.enAttente) active.push('En attente');
  if (filters.value.enCours) active.push('En cours');
  if (filters.value.resolus) active.push('Résolu');
  if (filters.value.rejete) active.push('Rejeté');
  return active;
});

function openFilterModal() {
  isFilterModalOpen.value = true;
}

function closeFilterModal() {
  isFilterModalOpen.value = false;
}
</script>

<style scoped>
.map-page {
  --background: #FFFFFF;
}

.map-toolbar {
  --background: #FFFFFF;
  --border-color: #E5E7EB;
}

.map-title {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
}

ion-buttons ion-button {
  --color: #3B82F6;
}

ion-buttons ion-icon {
  font-size: 24px;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Modal de filtres personnalisé */
ion-modal {
  --width: 90%;
  --max-width: 400px;
  --height: auto;
  --border-radius: 16px;
  --box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.filter-modal {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #E5E7EB;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.filter-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B7280;
  font-size: 24px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #F3F4F6;
  color: #1F2937;
}

.filter-content {
  padding: 16px 24px 24px;
  overflow-y: auto;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #F3F4F6;
}

.filter-item:last-child {
  border-bottom: none;
}

.filter-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.filter-label {
  font-size: 15px;
  font-weight: 500;
  color: #1F2937;
}

ion-toggle {
  --background: #E5E7EB;
  --background-checked: #10B981;
  --handle-background: #FFFFFF;
  --handle-background-checked: #FFFFFF;
}
</style>
