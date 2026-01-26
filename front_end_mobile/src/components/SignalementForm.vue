<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Créer Signalement</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">Fermer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-item>
          <ion-label position="stacked">Titre</ion-label>
          <ion-input v-model="form.titre" placeholder="Titre du signalement"></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="stacked">Description</ion-label>
          <ion-textarea v-model="form.description" placeholder="Détail du signalement"></ion-textarea>
        </ion-item>
        
        <ion-item>
          <ion-label position="stacked">Type de travail</ion-label>
          <ion-select v-model="form.id_type_travail" placeholder="Sélectionner un type">
            <ion-select-option 
              v-for="type in typesTravail" 
              :key="type.id" 
              :value="type.id"
            >
              {{ type.libelle }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        
        <ion-item>
          <ion-label position="stacked">Surface (m²)</ion-label>
          <ion-input v-model.number="form.surface_metre_carree" type="number" placeholder="0" min="0"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">URL Photo</ion-label>
          <ion-input v-model="form.url_photo" type="text" placeholder="https://example.com/photo.jpg"></ion-input>
        </ion-item>
        
        <ion-button 
          type="submit" 
          expand="block"
          :disabled="loading || !form.id_type_travail"
        >
          {{ loading ? 'Création...' : 'Créer' }}
        </ion-button>
        
        <ion-text color="danger" v-if="error">
          <p>{{ error }}</p>
        </ion-text>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createSignalement, getTypesTravail } from '@/services/signalementService';
import type { TypeTravail } from '@/services/signalementService';
import { currentUser, loadUserFromStorage } from '@/composables/useAuth';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText
} from '@ionic/vue';

const props = defineProps<{ isOpen: boolean; location?: { lat: number; lng: number } }>();
const emit = defineEmits<{ close: []; created: [] }>();

const form = ref({ 
  titre: '', 
  description: '', 
  id_type_travail: '',
  surface_metre_carree: 0,
  url_photo: ''
});

const typesTravail = ref<TypeTravail[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loadUserFromStorage();
  typesTravail.value = await getTypesTravail();
});

async function submit() {
  if (!props.location || !form.value.id_type_travail) {
    error.value = 'Localisation et type de travail requis';
    return;
  }
  
  // Vérifier que l'utilisateur est connecté
  if (!currentUser.value || !currentUser.value.id) {
    error.value = 'Vous devez être connecté pour créer un signalement';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    await createSignalement({
      latitude: props.location.lat,
      longitude: props.location.lng,
      description: form.value.description,
      titre: form.value.titre,
      id_type_travail: form.value.id_type_travail,
      surface_metre_carree: form.value.surface_metre_carree,
      url_photo: form.value.url_photo,
      id_utilisateur: currentUser.value.id,
      date_creation: Date.now()
    });
    
    emit('created');
    closeModal();
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création';
    console.error('Erreur:', err);
  } finally {
    loading.value = false;
  }
}

function closeModal() {
  form.value = { titre: '', description: '', id_type_travail: '', surface_metre_carree: 0, url_photo: '' };
  error.value = null;
  emit('close');
}
</script>
