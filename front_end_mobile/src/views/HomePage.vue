<template>
  <ion-page>
    <ion-content :fullscreen="true" class="home-content">
      <div class="home-container">
        <!-- Icon Section -->
        <div class="icon-wrapper">
          <div class="icon-background">
            <ion-icon :icon="constructIcon" class="main-icon"></ion-icon>
          </div>
        </div>

        <!-- Title Section -->
        <div class="text-section">
          <h1 class="main-title">Signalements Routiers</h1>
          <p class="subtitle">Signalez et suivez les travaux routiers en temps réel</p>
        </div>

        <!-- Action Button -->
        <div class="button-section">
          <ion-button 
            expand="block" 
            class="login-button"
            @click="goToLogin"
          >
            Connexion
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { 
  IonPage, 
  IonContent, 
  IonButton, 
  IonIcon 
} from '@ionic/vue';
import { 
  construct as constructIcon
} from 'ionicons/icons';

const router = useRouter();

function goToLogin() {
  router.push('/login');
}
</script>

<style scoped>
.home-content {
  --background: #FFFFFF;
}

.home-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  min-height: 100%;
  padding: 60px 32px 40px;
}

/* Icon Section */
.icon-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  animation: fadeInScale 0.8s ease;
}

.icon-background {
  position: relative;
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3);
  animation: float 3s ease-in-out infinite;
}

.main-icon {
  font-size: 90px;
  color: #FFFFFF;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

/* Text Section */
.text-section {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInUp 0.8s ease 0.2s backwards;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  color: #1F2937;
  margin: 0 0 16px 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0;
  font-weight: 500;
  line-height: 1.5;
  padding: 0 20px;
}

/* Button Section */
.button-section {
  width: 100%;
  max-width: 400px;
  animation: fadeInUp 0.8s ease 0.4s backwards;
}

.login-button {
  --background: #1F2937;
  --background-hover: #111827;
  --background-activated: #111827;
  --border-radius: 16px;
  --box-shadow: 0 10px 30px rgba(31, 41, 55, 0.2);
  height: 56px;
  font-weight: 700;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  margin: 0;
}

/* Animations */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

/* Responsive */
@media (max-width: 375px) {
  .icon-background {
    width: 150px;
    height: 150px;
  }
  
  .main-icon {
    font-size: 75px;
  }
  
  .main-title {
    font-size: 28px;
  }
  
  .subtitle {
    font-size: 15px;
  }
}
</style>
