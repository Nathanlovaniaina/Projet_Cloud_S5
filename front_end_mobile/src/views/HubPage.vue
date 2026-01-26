<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Menu</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onLogout" color="danger">Déconnexion</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="hub-container">
        <div class="welcome-section">
          <h1>Bienvenue</h1>
          <p v-if="user">{{ user.prenom }} {{ user.nom }}</p>
        </div>

        <div class="buttons-section">
          <ion-button 
            expand="block" 
            size="large" 
            class="hub-button"
            @click="goToMap"
          >
            <ion-icon slot="start" :icon="mapIcon"></ion-icon>
            Voir la Carte
          </ion-button>

          <ion-button 
            expand="block" 
            size="large" 
            class="hub-button"
            @click="goToCreateSignalement"
          >
            <ion-icon slot="start" :icon="addIcon"></ion-icon>
            Ajouter Signalement
          </ion-button>

          <ion-button 
            expand="block" 
            size="large" 
            class="hub-button"
            @click="goToProfile"
          >
            <ion-icon slot="start" :icon="personIcon"></ion-icon>
            Mon Profil
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonButtons, 
  IonIcon 
} from '@ionic/vue';
import { map as mapIcon, person as personIcon, add as addIcon } from 'ionicons/icons';
import { logout, currentUser, loadUserFromStorage } from '@/composables/useAuth';

interface User {
  nom?: string;
  prenom?: string;
  [key: string]: any;
}

const user = ref<User | null>(null);
const router = useRouter();

onMounted(() => {
  loadUserFromStorage();
  user.value = currentUser.value;
});

function goToMap() {
  router.push('/home');
}

function goToCreateSignalement() {
  router.push('/home?createMode=true');
}

function goToProfile() {
  router.push('/profile');
}

async function onLogout() {
  await logout();
  router.push('/login');
}
</script>

<style scoped>
.hub-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
  gap: 3rem;
}

.welcome-section {
  text-align: center;
}

.welcome-section h1 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  color: var(--ion-color-primary);
}

.welcome-section p {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
}

.buttons-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.hub-button {
  --padding-start: 2rem;
  --padding-end: 2rem;
  font-size: 1.1rem;
  height: 60px;
  border-radius: 8px;
}
</style>
