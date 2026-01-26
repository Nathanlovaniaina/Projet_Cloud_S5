<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-container">
        <!-- Logo/Brand Section -->
        <div class="brand-section">
          <div class="app-icon">
            <ion-icon :icon="mapIcon" class="icon-large"></ion-icon>
          </div>
          <h1 class="app-title">Signalements</h1>
          <p class="app-subtitle">Gérez vos signalements facilement</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="onSubmit" class="login-form">
          <div class="input-group">
            <label class="input-label">Email</label>
            <ion-input
              v-model="email"
              type="email"
              placeholder="votre@email.com"
              required
              class="modern-input"
              :class="{ 'input-filled': email }"
            ></ion-input>
          </div>

          <div class="input-group">
            <label class="input-label">Mot de passe</label>
            <ion-input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              class="modern-input"
              :class="{ 'input-filled': password }"
            ></ion-input>
          </div>

          <ion-button 
            type="submit" 
            expand="block" 
            :disabled="loading"
            class="login-button"
          >
            <ion-icon v-if="!loading" slot="start" :icon="logInIcon"></ion-icon>
            {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
          </ion-button>

          <div v-if="error" class="error-message">
            <ion-icon :icon="alertCircleIcon" class="error-icon"></ion-icon>
            <span>{{ error }}</span>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, 
  IonContent, 
  IonInput, 
  IonButton, 
  IonIcon 
} from '@ionic/vue';
import { 
  logIn as logInIcon, 
  map as mapIcon,
  alertCircle as alertCircleIcon 
} from 'ionicons/icons';
import { login } from '@/composables/useAuth';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const router = useRouter();

async function onSubmit() {
  error.value = '';
  loading.value = true;
  
  try {
    const user = await login(email.value, password.value);
    if (user) {
      router.push('/tabs/map');
    } else {
      error.value = 'Utilisateur introuvable';
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur de connexion';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-content {
  --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 40px 24px;
}

.brand-section {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInDown 0.6s ease;
}

.app-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.icon-large {
  font-size: 56px;
  color: white;
}

.app-title {
  font-size: 36px;
  font-weight: 800;
  color: white;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
}

.login-form {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.6s ease;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  padding-left: 4px;
}

.modern-input {
  --background: var(--ion-color-light);
  --color: var(--ion-color-dark);
  --placeholder-color: var(--ion-color-medium);
  --placeholder-opacity: 0.6;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;  --highlight-color-focus: transparent;  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.modern-input.input-filled {
  --background: rgba(var(--ion-color-primary-rgb), 0.08);
}

.login-button {
  --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  --border-radius: 12px;
  margin-top: 12px;
  height: 56px;
  font-weight: 700;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.4);
}

.login-button:disabled {
  opacity: 0.6;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 14px 16px;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-left: 4px solid var(--ion-color-danger);
  border-radius: 8px;
  color: var(--ion-color-danger);
  font-size: 14px;
  font-weight: 500;
  animation: shake 0.5s ease;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .login-form {
    background: rgba(30, 41, 59, 0.95);
  }

  .input-label {
    color: var(--ion-color-light);
  }

  .modern-input {
    --background: rgba(255, 255, 255, 0.05);
    --color: var(--ion-color-light);
  }

  .modern-input.input-filled {
    --background: rgba(var(--ion-color-primary-rgb), 0.2);
  }
}
</style>
