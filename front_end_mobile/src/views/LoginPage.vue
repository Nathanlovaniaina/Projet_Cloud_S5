<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="login-container">
        <h1>Se connecter</h1>
        <form @submit.prevent="onSubmit">
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input v-model="email" type="email" required></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Mot de passe</ion-label>
            <ion-input v-model="password" type="password" required></ion-input>
          </ion-item>
          <ion-button type="submit" expand="block" class="ion-margin-top">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </ion-button>
        </form>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
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
      router.push('/profile');
    } else {
      error.value = 'Utilisateur introuvable dans Firestore';
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur de connexion';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  padding: 2rem 1rem;
  max-width: 400px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.error-message {
  color: #f04141;
  padding: 1rem;
  border-radius: 4px;
  background: rgba(240, 65, 65, 0.1);
  margin-top: 1rem;
  text-align: center;
}
</style>
