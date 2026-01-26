<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Carte Signalements</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="arrowBackIcon"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="toggleCreating" :color="isCreating ? 'success' : 'primary'">
            {{ isCreating ? '✓ Créer' : '+ Signalement' }}
          </ion-button>
          <ion-button @click="toggleFilter" :color="filterMySignalements ? 'success' : 'medium'">
            <ion-icon slot="icon-only" :icon="filterIcon"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-page">
      <Map ref="mapRef" :is-creating="isCreating" :filter-my-signalements="filterMySignalements" @location-selected="selectedLocation = $event" />
      <SignalementForm 
        :is-open="showForm" 
        :location="selectedLocation"
        @close="closeForm"
        @created="onSignalementCreated"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon } from '@ionic/vue';
import { arrowBack as arrowBackIcon, funnel as filterIcon } from 'ionicons/icons';
import Map from '@/components/Map.vue';
import SignalementForm from '@/components/SignalementForm.vue';

const router = useRouter();
const route = useRoute();
const mapRef = ref<any>(null);

const isCreating = ref(false);
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);
const showForm = ref(false);
const filterMySignalements = ref(false);

function goBack() {
  router.back();
}

function toggleCreating() {
  isCreating.value = !isCreating.value;
  if (isCreating.value) {
    selectedLocation.value = null;
  } else {
    closeForm();
  }
}

function toggleFilter() {
  filterMySignalements.value = !filterMySignalements.value;
}

function closeForm() {
  showForm.value = false;
  isCreating.value = false;
  selectedLocation.value = null;
}

function onSignalementCreated() {
  closeForm();
  // Recharger les signalements sur la carte
  mapRef.value?.refreshSignalements();
}

// Ouvrir le formulaire quand une localisation est sélectionnée
watch(() => selectedLocation.value, (newLocation) => {
  if (newLocation && isCreating.value) {
    showForm.value = true;
  }
});

// Vérifier si on arrive avec le mode création activé
onMounted(() => {
  if (route.query.createMode === 'true') {
    isCreating.value = true;
  }
});
</script>

<style scoped>
html, body, #app, ion-app, ion-content.map-page {
  height: 100%;
}
.map-page {
  --padding-bottom: 0;
  --padding-end: 0;
  --padding-start: 0;
  --padding-top: 0;
  height: 100%;
  overflow: hidden;
}
.map-container, #map {
  height: 100% !important;
  width: 100% !important;
}
</style>
