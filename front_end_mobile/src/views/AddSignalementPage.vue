<template>
  <ion-page>
    <ion-content :fullscreen="true" class="add-content">
      <div class="form-container">
        <div class="form-header">
          <h1 class="form-title">Nouveau Signalement</h1>
          <p class="form-subtitle">Ajoutez les détails de votre signalement</p>
        </div>

        <form @submit.prevent="submit" class="modern-form">
          <!-- Titre -->
          <div class="input-group">
            <label class="input-label">Titre</label>
            <ion-input
              v-model="form.titre"
              placeholder="Ex: Route endommagée"
              class="modern-input"
              :class="{ 'input-filled': form.titre }"
            ></ion-input>
          </div>

          <!-- Description -->
          <div class="input-group">
            <label class="input-label">Description</label>
            <ion-textarea
              v-model="form.description"
              placeholder="Décrivez le problème en détail..."
              :rows="4"
              class="modern-textarea"
              :class="{ 'input-filled': form.description }"
            ></ion-textarea>
          </div>

          <!-- Type de travail -->
          <div class="input-group">
            <label class="input-label">Type de travail</label>
            <ion-select
              v-model="form.id_type_travail"
              placeholder="Sélectionner un type"
              interface="action-sheet"
              class="modern-select"
            >
              <ion-select-option 
                v-for="type in typesTravail" 
                :key="type.id" 
                :value="Number(type.id)"
              >
                {{ type.libelle }}
              </ion-select-option>
            </ion-select>
          </div>

          <!-- Surface -->
          <div class="input-group">
            <label class="input-label">Surface (m²)</label>
            <ion-input
              v-model.number="form.surface_metre_carree"
              type="number"
              placeholder="0"
              min="0"
              class="modern-input"
              :class="{ 'input-filled': form.surface_metre_carree > 0 }"
            ></ion-input>
          </div>

          <!-- URL Photo -->
          <div class="input-group">
            <label class="input-label">Photo (optionnel)</label>
            <ion-input
              v-model="form.url_photo"
              type="text"
              placeholder="https://example.com/photo.jpg"
              class="modern-input"
              :class="{ 'input-filled': form.url_photo }"
            ></ion-input>
          </div>

          <!-- Affichage de la localisation -->
          <div v-if="selectedLocation" class="location-display">
            <ion-icon :icon="locationIcon" class="location-icon"></ion-icon>
            <div class="location-text">
              <span class="location-label">Position sélectionnée</span>
              <span class="location-coords">
                {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
              </span>
            </div>
          </div>

          <!-- Message d'erreur -->
          <ion-text color="danger" v-if="error" class="error-message">
            <p>{{ error }}</p>
          </ion-text>

          <!-- Boutons d'action -->
          <div class="action-buttons">
            <ion-button
              @click="useMyPosition"
              expand="block"
              fill="outline"
              :disabled="loadingPosition"
              class="action-btn"
            >
              <ion-icon slot="start" :icon="navigateIcon"></ion-icon>
              {{ loadingPosition ? 'Localisation...' : 'Ma Position' }}
            </ion-button>

            <ion-button
              @click="selectFromMap"
              expand="block"
              fill="outline"
              class="action-btn"
            >
              <ion-icon slot="start" :icon="mapIcon"></ion-icon>
              Localiser
            </ion-button>

            <ion-button
              type="submit"
              expand="block"
              :disabled="!canSubmit || loading"
              class="submit-btn"
            >
              <ion-icon slot="start" :icon="checkmarkIcon"></ion-icon>
              {{ loading ? 'Création...' : 'Créer le Signalement' }}
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>

    <!-- Modal pour sélectionner depuis la carte -->
    <ion-modal :is-open="showMapModal" @didDismiss="closeMapModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Sélectionner une position</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeMapModal">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <MapSelector @location-selected="onLocationFromMap" />
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonText,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/vue';
import {
  checkmark as checkmarkIcon,
  navigate as navigateIcon,
  map as mapIcon,
  location as locationIcon
} from 'ionicons/icons';
import { getCurrentPosition } from '@/composables/useGeolocation';
import { createSignalement, getTypesTravail } from '@/services/signalementService';
import type { TypeTravail } from '@/services/signalementService';
import { currentUser, loadUserFromStorage } from '@/composables/useAuth';
import MapSelector from '@/components/MapSelector.vue';

const router = useRouter();

const form = ref({
  titre: '',
  description: '',
  // null until the user selects a type; we'll store numbers
  id_type_travail: null,
  surface_metre_carree: 0,
  url_photo: ''
});

const typesTravail = ref<TypeTravail[]>([]);
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);
const loading = ref(false);
const loadingPosition = ref(false);
const error = ref<string | null>(null);
const showMapModal = ref(false);

const canSubmit = computed(() => {
  return !!form.value.titre && 
         form.value.id_type_travail !== null && 
         !!selectedLocation.value;
});

onMounted(async () => {
  loadUserFromStorage();
  typesTravail.value = await getTypesTravail();
});

async function useMyPosition() {
  loadingPosition.value = true;
  error.value = null;
  
  try {
    const position = await getCurrentPosition();
    if (position) {
      selectedLocation.value = position;
    } else {
      error.value = 'Impossible de récupérer votre position';
    }
  } catch (err) {
    error.value = 'Erreur lors de la géolocalisation';
  } finally {
    loadingPosition.value = false;
  }
}

function selectFromMap() {
  showMapModal.value = true;
}

function closeMapModal() {
  showMapModal.value = false;
}

function onLocationFromMap(location: { lat: number; lng: number }) {
  selectedLocation.value = location;
  closeMapModal();
}

async function submit() {
  if (!selectedLocation.value || form.value.id_type_travail === null) {
    error.value = 'Localisation et type de travail requis';
    return;
  }

  if (!currentUser.value || !currentUser.value.id) {
    error.value = 'Vous devez être connecté pour créer un signalement';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await createSignalement({
      latitude: selectedLocation.value.lat,
      longitude: selectedLocation.value.lng,
      description: form.value.description,
      titre: form.value.titre,
      id_type_travail: form.value.id_type_travail,
      surface_metre_carree: form.value.surface_metre_carree,
      url_photo: form.value.url_photo,
      id_utilisateur: currentUser.value.id,
      date_creation: Date.now()
    });

    // Réinitialiser le formulaire
    form.value = {
      titre: '',
      description: '',
      id_type_travail: null,
      surface_metre_carree: 0,
      url_photo: ''
    };
    selectedLocation.value = null;
    
    // Rediriger vers la carte
    router.push('/tabs/map');
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création';
    console.error('Erreur:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.add-content {
  --background: var(--ion-background-color);
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 20px 100px 20px;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
  padding-top: 20px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--ion-text-color);
}

.form-subtitle {
  font-size: 15px;
  color: var(--ion-color-medium);
  margin: 0;
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  padding-left: 4px;
}

.modern-input,
.modern-textarea,
.modern-select {
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

.modern-input.input-filled,
.modern-textarea.input-filled {
  --background: var(--ion-color-primary-tint);
  --color: var(--ion-color-dark);
}

.modern-textarea {
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.location-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, var(--ion-color-secondary-tint) 100%);
  border-radius: 12px;
  margin: 8px 0;
}

.location-icon {
  font-size: 32px;
  color: var(--ion-color-primary);
}

.location-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.location-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.location-coords {
  font-size: 12px;
  color: var(--ion-color-medium);
  font-family: monospace;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.action-btn {
  --border-width: 2px;
  --border-radius: 12px;
  font-weight: 600;
  height: 48px;
  text-transform: none;
  letter-spacing: 0.3px;
}

.submit-btn {
  --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  --border-radius: 12px;
  font-weight: 700;
  height: 56px;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
}

.error-message {
  padding: 12px;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: 8px;
  text-align: center;
}

.error-message p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .form-title {
    color: var(--ion-color-light);
  }
  
  .input-label {
    color: var(--ion-color-light);
  }

  .modern-input,
  .modern-textarea,
  .modern-select {
    --background: rgba(255, 255, 255, 0.05);
    --color: var(--ion-color-light);
  }

  .modern-input.input-filled,
  .modern-textarea.input-filled {
    --background: rgba(var(--ion-color-primary-rgb), 0.2);
    --color: var(--ion-color-light);
  }

  .location-label {
    color: var(--ion-color-light);
  }
}
</style>
