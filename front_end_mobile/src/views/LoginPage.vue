<template>
  <ion-page>
    <ion-content class="login-content" :fullscreen="false">
      <!-- Back Button -->
      <button class="back-button" @click="goBack">
        <ion-icon :icon="chevronBackIcon"></ion-icon>
      </button>

      <div class="login-container">
        <!-- Welcome Text -->
        <div class="welcome-section">
          <h1 class="welcome-title">Content de vous revoir ev!</h1>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="onSubmit" class="login-form" autocomplete="off">
          <div class="input-group">
            <label class="input-label">Email</label>
            <ion-input
              :value="email"
              @ionInput="email = $event.detail.value ?? ''"
              type="email"
              inputmode="email"
              autocomplete="off"
              placeholder="votre@email.com"
              required
              class="modern-input"
              :class="{ 'input-filled': email }"
            ></ion-input>
          </div>

          <div class="input-group">
            <label class="input-label">Mot de passe</label>
            <ion-input
              :value="password"
              @ionInput="password = $event.detail.value ?? ''"
              type="password"
              autocomplete="off"
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
import { ref, onMounted } from 'vue';
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
  alertCircle as alertCircleIcon,
  chevronBack as chevronBackIcon
} from 'ionicons/icons';
import { login } from '@/composables/useAuth';
import { useKeyboardFix } from '@/composables/useKeyboardFix';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const router = useRouter();

// Appliquer le fix du clavier
useKeyboardFix();

onMounted(() => {
  // Nettoyer les valeurs au montage
  email.value = '';
  password.value = '';
  error.value = '';
  
  // Debug focus events
  document.addEventListener('focusin', e => {
    console.log('FOCUS:', e.target);
  });
});

function goBack() {
  router.push('/home');
}

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
  --background: #FFFFFF;
}

.back-button {
  position: absolute;
  top: calc(var(--ion-safe-area-top) + 10px);
  left: 20px;
  width: 40px;
  height: 40px;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1F2937;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
}

.back-button ion-icon {
  font-size: 24px;
}

.back-button:hover {
  transform: scale(1.1);
  color: #3B82F6;
}

.back-button:active {
  transform: scale(0.95);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 20px 24px 40px;
}

.welcome-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 32px;
  animation: fadeInDown 0.6s ease;
}

.welcome-title {
  font-size: 30px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
  line-height: 1.3;
}

.login-form {
  width: 100%;
  max-width: 400px;
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
  color: #1F2937;
  padding-left: 4px;
}

.modern-input {
  --background: #F3F4F6;
  --color: #1F2937;
  --placeholder-color: #9CA3AF;
  --placeholder-opacity: 1;
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --border-radius: 12px;
  --highlight-height: 0;
  font-size: 15px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
}

.modern-input.input-filled {
  --background: #EFF6FF;
  border-color: #3B82F6;
}

.modern-input:focus-within {
  --background: #EFF6FF;
  border-color: #3B82F6;
}

.login-button {
  --background: #1F2937;
  --background-hover: #111827;
  --background-activated: #111827;
  --border-radius: 12px;
  --box-shadow: 0 10px 30px rgba(31, 41, 55, 0.2);
  margin-top: 12px;
  height: 56px;
  font-weight: 700;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
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
  background: #FEE2E2;
  border-left: 4px solid #EF4444;
  border-radius: 8px;
  color: #DC2626;
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
  .login-content {
    --background: #111827;
  }

  .welcome-title {
    color: #F9FAFB;
  }

  .input-label {
    color: #F3F4F6;
  }

  .modern-input {
    --background: #1F2937;
    --color: #F9FAFB;
    --placeholder-color: #6B7280;
  }

  .modern-input.input-filled,
  .modern-input:focus-within {
    --background: #1E3A8A;
    border-color: #60A5FA;
  }
}
</style>
