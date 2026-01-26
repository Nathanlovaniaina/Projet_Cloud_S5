<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="arrowBackIcon"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Mon profil</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onLogout" color="danger">Logout</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="user" class="profile-container">
        <h2>{{ user.nom }} {{ user.prenom }}</h2>
        <ion-list>
          <ion-item>
            <ion-label>Email</ion-label>
            <ion-text slot="end">{{ user.email }}</ion-text>
          </ion-item>
          <ion-item>
            <ion-label>UID Firebase</ion-label>
            <ion-text slot="end">{{ user.firebase_uid }}</ion-text>
          </ion-item>
          <ion-item>
            <ion-label>Type utilisateur</ion-label>
            <ion-text slot="end">{{ user.id_type_utilisateur }}</ion-text>
          </ion-item>
        </ion-list>
      </div>
      <div v-else class="not-connected">
        <p>Non connecté</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonList, IonItem, IonLabel, IonText, IonIcon } from '@ionic/vue';
import { arrowBack as arrowBackIcon } from 'ionicons/icons';
import { logout, currentUser, loadUserFromStorage } from '@/composables/useAuth';

interface User {
  nom?: string;
  prenom?: string;
  email?: string;
  firebase_uid?: string;
  id_type_utilisateur?: number;
  [key: string]: any;
}

const user = ref<User | null>(null);
const router = useRouter();

onMounted(() => {
  loadUserFromStorage();
  user.value = currentUser.value;
});

function goBack() {
  router.back();
}

async function onLogout() {
  await logout();
  router.push('/login');
}
</script>

<style scoped>
.profile-container {
  padding: 1rem;
}

.profile-container h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.not-connected {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}
</style>
