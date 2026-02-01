<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="profile-toolbar">
        <ion-title>Profil</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="profile-content">
      <ion-header collapse="condense">
        <ion-toolbar class="profile-toolbar">
          <ion-title size="large">Profil</ion-title>
        </ion-toolbar>
      </ion-header>
      <div class="profile-container" v-if="user">
        <!-- Header Section -->
        <div class="profile-header">
          <div class="avatar-container">
            <div class="avatar">
              <ion-icon :icon="personIcon" class="avatar-icon"></ion-icon>
            </div>
            <div class="status-badge"></div>
          </div>
          
          <h1 class="user-name">{{ user.prenom }} {{ user.nom }}</h1>
          <p class="user-role">{{ typeUtilisateurLabel }}</p>
        </div>

        <!-- Info Cards -->
        <div class="info-cards">
          <div class="info-card">
            <div class="info-card-icon">
              <ion-icon :icon="mailIcon"></ion-icon>
            </div>
            <div class="info-card-content">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user.email || 'Non renseigné' }}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-icon">
              <ion-icon :icon="shieldIcon"></ion-icon>
            </div>
            <div class="info-card-content">
              <span class="info-label">Type d'utilisateur</span>
              <span class="info-value">{{ typeUtilisateurLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
          <ion-button 
            @click="handleLogout" 
            expand="block"
            color="danger"
            class="logout-button"
          >
            <ion-icon slot="start" :icon="logOutIcon"></ion-icon>
            Déconnexion
          </ion-button>
        </div>
      </div>

      <!-- État non connecté -->
      <div v-else class="not-connected-container">
        <ion-icon :icon="personCircleIcon" class="not-connected-icon"></ion-icon>
        <h2>Non connecté</h2>
        <p>Veuillez vous connecter pour accéder à votre profil</p>
        <ion-button @click="goToLogin" expand="block">
          Se connecter
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  alertController
} from '@ionic/vue';
import {
  person as personIcon,
  mail as mailIcon,
  shield as shieldIcon,
  key as keyIcon,
  logOut as logOutIcon,
  personCircle as personCircleIcon,
  alertCircle as alertCircleIcon,
  checkmarkCircle as checkmarkCircleIcon
} from 'ionicons/icons';
import { logout, currentUser, loadUserFromStorage } from '@/composables/useAuth';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface User {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  firebase_uid?: string;
  id_type_utilisateur?: number;
  [key: string]: any;
}

const router = useRouter();
const user = ref<User | null>(null);
const typeUtilisateurLabel = ref('Utilisateur');

onMounted(async () => {
  loadUserFromStorage();
  user.value = currentUser.value;
  
  if (user.value) {
    await loadTypeUtilisateur();
  }
});

// Récupérer le libellé du type d'utilisateur
async function loadTypeUtilisateur() {
  if (!user.value || !user.value.id_type_utilisateur) return;
  
  try {
    const typeDoc = await getDocs(
      query(
        collection(db, 'type_utilisateur'),
        where('id', '==', user.value.id_type_utilisateur)
      )
    );
    
    if (!typeDoc.empty) {
      typeUtilisateurLabel.value = typeDoc.docs[0].data().libelle || 'Utilisateur';
    }
  } catch (error) {
    console.error('Erreur récupération type utilisateur:', error);
  }
}

async function handleLogout() {
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
      },
      {
        text: 'Déconnexion',
        role: 'confirm',
        handler: async () => {
          await logout();
          router.push('/login');
        },
      },
    ],
  });

  await alert.present();
}

function goToLogin() {
  router.push('/login');
}
</script>

<style scoped>
.profile-content {
  --background: #FFFFFF;
}

.profile-toolbar {
  --background: #FFFFFF;
  --border-color: #E5E7EB;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px 100px 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 20px;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.avatar-icon {
  font-size: 64px;
  color: white;
}

.status-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #10B981;
  border-radius: 50%;
  border: 3px solid #FFFFFF;
}

.user-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1F2937;
}

.user-role {
  font-size: 16px;
  color: #6B7280;
  margin: 0;
  font-weight: 500;
}

.info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: #F9FAFB;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.info-card:active {
  transform: scale(0.98);
}

.info-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-card-icon ion-icon {
  font-size: 24px;
  color: white;
}

.info-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #1F2937;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value-small {
  font-size: 13px;
  font-family: monospace;
}

.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.stat-card {
  padding: 20px;
  background: #EFF6FF;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 32px;
  color: #3B82F6;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1F2937;
}

.stat-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.action-section {
  margin-top: 32px;
}

.logout-button {
  --border-radius: 12px;
  height: 56px;
  font-weight: 700;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.not-connected-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
}

.not-connected-icon {
  font-size: 120px;
  color: #9CA3AF;
  margin-bottom: 24px;
  opacity: 0.5;
}

.not-connected-container h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #1F2937;
}
</style>
