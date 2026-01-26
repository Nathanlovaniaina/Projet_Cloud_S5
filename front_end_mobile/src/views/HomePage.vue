<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Carte Signalements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-page">
      <Map />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import Map from '@/components/Map.vue';
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
