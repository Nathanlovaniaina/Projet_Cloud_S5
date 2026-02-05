<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { usePushNotifications } from './composables/usePushNotifications';

// Initialiser les push notifications au démarrage de l'app
const { initializePushNotifications } = usePushNotifications();

onMounted(async () => {
  console.log('🚀 App.vue mounted - Initialisation des services...');
  
  // Initialiser les push notifications
  try {
    await initializePushNotifications();
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    // Continuer même en cas d'erreur
  }
});
</script>
