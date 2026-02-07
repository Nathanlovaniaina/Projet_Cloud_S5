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

          <!-- Upload Photos -->
          <div class="input-group">
            <label class="input-label">Photos (optionnel)</label>
            <ion-button
              expand="block"
              fill="outline"
              @click="uploadPhoto"
              :disabled="loadingPhoto"
              class="action-btn"
            >
              <ion-icon slot="start" :icon="cameraIcon"></ion-icon>
              {{ loadingPhoto ? 'Upload en cours...' : 'Ajouter une photo' }}
            </ion-button>
            
            <!-- Galerie de photos -->
            <div v-if="photos.length > 0" class="photos-gallery">
              <div v-for="(photo, index) in photos" :key="index" class="photo-item">
                <img :src="photo.preview" alt="Photo" class="photo-preview" />
                <ion-button 
                  size="small" 
                  color="danger" 
                  @click="removePhoto(index)"
                  class="remove-photo-btn"
                >
                  <ion-icon :icon="closeIcon"></ion-icon>
                </ion-button>
              </div>
            </div>
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
  location as locationIcon,
  camera as cameraIcon,
  close as closeIcon
} from 'ionicons/icons';
import { getCurrentPosition } from '@/composables/useGeolocation';
import { createSignalement, getTypesTravail, createPhotoSignalement } from '@/services/signalementService';
import type { TypeTravail } from '@/services/signalementService';
import { currentUser, loadUserFromStorage } from '@/composables/useAuth';
import MapSelector from '@/components/MapSelector.vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toastController } from '@ionic/vue';

const router = useRouter();

const form = ref({
  titre: '',
  description: '',
  // null until the user selects a type; we'll store numbers
  id_type_travail: null,
  surface_metre_carree: 0,
  url_photo: ''
});

// Configuration Cloudinary
const CLOUD_NAME = 'dz73oiwfz';
const UPLOAD_PRESET = 'cloud_projet_s5';

// Photos
interface Photo {
  preview: string; // URL locale pour affichage
  cloudinaryUrl: string; // URL Cloudinary après upload
}

const photos = ref<Photo[]>([]);
const loadingPhoto = ref(false);

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

/**
 * Upload une photo vers Cloudinary avec transformation
 */
async function uploadToCloudinary(base64String: string, format: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', `data:image/${format};base64,${base64String}`);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);
  formData.append('folder', 'rojo/image'); // Dossier dans Cloudinary

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Erreur lors de l\'upload');
  }

  const data = await response.json();
  
  // Transformer l'URL pour ajouter les paramètres de redimensionnement et compression
  // Format: https://res.cloudinary.com/<CLOUD_NAME>/image/upload/w_600,h_600,c_fill,q_auto/<path>
  const urlParts = data.secure_url.split('/upload/');
  const transformedUrl = `${urlParts[0]}/upload/w_600,h_600,c_fill,q_auto/${urlParts[1]}`;
  
  return transformedUrl;
}

/**
 * Sélectionne et upload une photo
 */
async function uploadPhoto() {
  loadingPhoto.value = true;
  error.value = null;

  try {
    // Sélectionner la photo
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
    });

    if (!image.base64String) {
      throw new Error('Aucune image sélectionnée');
    }

    // Preview locale
    const preview = `data:image/${image.format};base64,${image.base64String}`;

    // Upload vers Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(image.base64String, image.format || 'jpeg');

    // Ajouter à la liste
    photos.value.push({ preview, cloudinaryUrl });

    const toast = await toastController.create({
      message: 'Photo ajoutée avec succès!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

  } catch (err: any) {
    console.error('Erreur upload photo:', err);
    error.value = err.message || 'Erreur lors de l\'upload';
    
    const toast = await toastController.create({
      message: 'Erreur lors de l\'upload de la photo',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  } finally {
    loadingPhoto.value = false;
  }
}

/**
 * Retire une photo de la liste
 */
function removePhoto(index: number) {
  photos.value.splice(index, 1);
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
    // 1. Créer le signalement
    const signalementIdNumber = await createSignalement({
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

    // 2. Créer les documents photo_signalement pour chaque photo
    if (photos.value.length > 0) {
      for (const photo of photos.value) {
        await createPhotoSignalement({
          id_signalement: signalementIdNumber,
          url_photo: photo.cloudinaryUrl
        });
      }
    }

    // Afficher un toast de succès
    const toast = await toastController.create({
      message: `Signalement créé avec ${photos.value.length} photo(s)!`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    // Réinitialiser le formulaire
    form.value = {
      titre: '',
      description: '',
      id_type_travail: null,
      surface_metre_carree: 0,
      url_photo: ''
    };
    selectedLocation.value = null;
    photos.value = [];
    
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
  --background: #FFFFFF;
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
  color: #1F2937;
}

.form-subtitle {
  font-size: 15px;
  color: #6B7280;
  margin: 0;
  font-weight: 500;
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
  color: #1F2937;
  padding-left: 4px;
}

.modern-input,
.modern-textarea,
.modern-select {
  --background: #F9FAFB;
  --color: #1F2937;
  --placeholder-color: #9CA3AF;
  --placeholder-opacity: 1;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --border-radius: 12px;
  --highlight-height: 0;
  font-size: 15px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
}

.modern-input:focus-within,
.modern-textarea:focus-within,
.modern-select:focus-within {
  --background: #EFF6FF;
  border-color: #3B82F6;
}

.modern-input.input-filled,
.modern-textarea.input-filled {
  --background: #EFF6FF;
  border-color: #3B82F6;
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
  background: #EFF6FF;
  border-radius: 12px;
  margin: 8px 0;
  border: 2px solid #3B82F6;
}

.location-icon {
  font-size: 32px;
  color: #3B82F6;
}

.location-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.location-label {
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
}

.location-coords {
  font-size: 12px;
  color: #6B7280;
  font-family: monospace;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.action-btn {
  --background: #FFFFFF;
  --background-hover: #F9FAFB;
  --background-activated: #F3F4F6;
  --border-color: #3B82F6;
  --border-width: 2px;
  --border-radius: 12px;
  --color: #3B82F6;
  font-weight: 600;
  height: 48px;
  text-transform: none;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.submit-btn {
  --background: #1F2937;
  --background-hover: #111827;
  --background-activated: #111827;
  --border-radius: 12px;
  --color: #FFFFFF;
  font-weight: 700;
  height: 56px;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0.5px;
  margin-top: 8px;
  box-shadow: 0 8px 20px rgba(31, 41, 55, 0.2);
}

.submit-btn:disabled {
  opacity: 0.5;
}

.error-message {
  padding: 12px;
  background: #FEE2E2;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #EF4444;
}

.error-message p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #DC2626;
}

.photos-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #E5E7EB;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  --padding-start: 0;
  --padding-end: 0;
  --border-radius: 50%;
}

.remove-photo-btn ion-icon {
  font-size: 16px;
}
</style>
