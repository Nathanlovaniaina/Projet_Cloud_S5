<template>
  <div class="map-container">
    <div ref="mapContainer" id="map"></div>
    
    <!-- Custom Popup Modal -->
    <div v-if="showPopup" class="popup-overlay" @click="closePopup">
      <div class="popup-content" @click.stop>
        <button type="button" class="popup-close" @click.stop="closePopup">×</button>
        
        <div v-if="selectedSignalement" style="font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 15px 0; color: #2196F3; font-size: 18px;">{{ selectedSignalement.titre }}</h3>
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
          
          <div style="margin-bottom: 12px;">
            <strong>Description:</strong><br/>
            <span style="color: #555; font-size: 14px; margin-top: 4px; display: block;">{{ selectedSignalement.description || 'Aucune description' }}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong>Surface:</strong> 
            <span style="color: #2196F3; font-weight: bold;">{{ selectedSignalement.surface }} m²</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong>Type de travail:</strong> 
            <span style="color: #ff9800; font-weight: bold;">{{ selectedSignalement.typeTravail }}</span>
          </div>
          
          <div>
            <strong>Statut:</strong> 
            <span style="color: #4CAF50; font-weight: bold;">{{ selectedSignalement.etat }}</span>
          </div>
          
          <!-- Galerie de photos -->
          <div v-if="selectedSignalement.photos && selectedSignalement.photos.length > 0" style="margin-top: 20px;">
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <strong style="display: block; margin-bottom: 12px;">Photos ({{ selectedSignalement.photos.length }}):</strong>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;">
              <div v-for="(photo, index) in selectedSignalement.photos" :key="index" 
                   style="aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid #E5E7EB; cursor: pointer;"
                   @click="openPhotoPreview(photo.url_photo)">
                <img :src="photo.url_photo" alt="Photo" 
                     style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de preview photo -->
    <div v-if="showPhotoPreview" class="photo-preview-overlay" @click="closePhotoPreview">
      <div class="photo-preview-content" @click.stop>
        <button type="button" class="popup-close" @click.stop="closePhotoPreview">×</button>
        <img :src="previewPhotoUrl" alt="Photo preview" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { onIonViewDidEnter } from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '@/composables/useGeolocation';
import { currentUser, loadUserFromStorage } from '@/composables/useAuth';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const mapContainer = ref<HTMLElement | null>(null);
let map: any = null;

export interface Props {
  isCreating?: boolean;
  filterMySignalements?: boolean;
  filterStatuses?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  isCreating: false,
  filterMySignalements: false,
  filterStatuses: () => ['En attente', 'En cours', 'Résolu', 'Rejeté']
});

const emit = defineEmits<{
  locationSelected: [location: { lat: number; lng: number }];
}>();

// Popup personnalisé
const showPopup = ref(false);
const selectedSignalement = ref<any>(null);

// Preview photo
const showPhotoPreview = ref(false);
const previewPhotoUrl = ref('');

interface PhotoSignalement {
  id: number;
  url_photo: string;
  date_ajout: number;
}

interface SignalementData {
  id: number;
  titre: string;
  description: string;
  surface: number;
  typeTravail: string;
  etat: string;
  photos?: PhotoSignalement[];
}

let temporaryMarker: any = null;

// Cache pour les types de travail et états
const typeTravailCache = new Map<number, string>();
const etatSignalementCache = new Map<number, string>();
const signalementMarkers = new Map<number, any>();

// Récupérer la couleur du marqueur selon l'état
function getMarkerColor(etat: string): string {
  switch (etat) {
    case 'En attente':
      return '#3B82F6'; // Bleu
    case 'En cours':
      return '#F59E0B'; // Orange
    case 'Résolu':
      return '#10B981'; // Vert
    case 'Rejeté':
      return '#EF4444'; // Rouge
    default:
      return '#6B7280'; // Gris par défaut
  }
}

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

// Récupérer le libellé d'un type de travail
async function getTypeTravailLibelle(idTypeTravail: number): Promise<string> {
  if (typeTravailCache.has(idTypeTravail)) {
    return typeTravailCache.get(idTypeTravail) || 'Non spécifié';
  }

  try {
    const typeDoc = await getDocs(query(collection(db, 'type_travail'), where('id', '==', idTypeTravail)));
    if (!typeDoc.empty) {
      const libelle = typeDoc.docs[0].data().libelle || 'Non spécifié';
      typeTravailCache.set(idTypeTravail, libelle);
      return libelle;
    }
  } catch (error) {
    console.error(`Erreur récupération type travail ${idTypeTravail}:`, error);
  }
  return 'Non spécifié';
}

// Récupérer le libellé de l'état du signalement
async function getEtatSignalementLibelle(idEtat: number): Promise<string> {
  if (etatSignalementCache.has(idEtat)) {
    return etatSignalementCache.get(idEtat) || 'Non spécifié';
  }

  try {
    const etatDoc = await getDocs(query(collection(db, 'etat_signalement'), where('id', '==', idEtat)));
    if (!etatDoc.empty) {
      const libelle = etatDoc.docs[0].data().libelle || 'Non spécifié';
      etatSignalementCache.set(idEtat, libelle);
      return libelle;
    }
  } catch (error) {
    console.error(`Erreur récupération état ${idEtat}:`, error);
  }
  return 'Non spécifié';
}

// Récupérer le dernier état du signalement
async function getDernierEtat(idSignalement: number): Promise<string> {
  try {
    // Récupérer tous les historiques pour ce signalement
    const historiqueQuery = query(
      collection(db, 'historique_etat_signalement'),
      where('id_signalement', '==', idSignalement)
    );
    
    const historiqueDoc = await getDocs(historiqueQuery);
    
    if (!historiqueDoc.empty) {
      // Trier par date_changement décroissant (le plus récent en premier)
      const historiques = historiqueDoc.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            id_etat: data.id_etat || 0,
            timestamp: data.date_changement || 0
          };
        })
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      if (historiques.length > 0) {
        const idEtat = historiques[0].id_etat as number;
        return await getEtatSignalementLibelle(idEtat);
      }
    }
  } catch (error) {
    console.error(`Erreur récupération dernier état pour signalement ${idSignalement}:`, error);
  }
  return 'Non spécifié';
}

function closePopup() {
  showPopup.value = false;
  selectedSignalement.value = null;
}

function openPhotoPreview(url: string) {
  previewPhotoUrl.value = url;
  showPhotoPreview.value = true;
}

function closePhotoPreview() {
  showPhotoPreview.value = false;
  previewPhotoUrl.value = '';
}

// Récupérer toutes les photos d'un signalement
async function getPhotosSignalement(idSignalement: number): Promise<PhotoSignalement[]> {
  try {
    const photosQuery = query(
      collection(db, 'photo_signalement'),
      where('id_signalement', '==', idSignalement)
    );
    
    const photosDoc = await getDocs(photosQuery);
    
    return photosDoc.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || 0,
        url_photo: data.url_photo || '',
        date_ajout: data.date_ajout || 0
      } as PhotoSignalement;
    });
  } catch (error) {
    console.error(`Erreur récupération photos signalement ${idSignalement}:`, error);
    return [];
  }
}

async function loadSignalements() {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'signalements')));
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const { latitude, longitude, description, titre, surface_metre_carree, id_type_travail, id, id_utilisateur } = data;
      
      // Vérifier le filtre "Mes Signalements"
      const passUserFilter = props.filterMySignalements 
        ? id_utilisateur === currentUser.value?.id 
        : true;
      
      if (!passUserFilter) continue;
      
      // Récupérer le type de travail et l'état
      const typeTravail = await getTypeTravailLibelle(id_type_travail);
      const etat = await getDernierEtat(id);
      
      // Vérifier le filtre de statut
      if (!props.filterStatuses.includes(etat)) continue;
      
      // Obtenir la couleur selon le statut
      const markerColor = getMarkerColor(etat);
      
      const marker = L.circleMarker([latitude, longitude], {
        radius: 8,
        color: markerColor,
        weight: 3,
        fillColor: markerColor,
        fillOpacity: 0.6
      }).addTo(map!);
      
      // Ajouter un event listener pour afficher le popup personnalisé
      marker.on('click', async () => {
        // Récupérer les photos du signalement
        const photos = await getPhotosSignalement(id);
        
        selectedSignalement.value = {
          id,
          titre: titre || 'Signalement',
          description,
          surface: surface_metre_carree || 0,
          typeTravail,
          etat,
          photos
        } as SignalementData;
        showPopup.value = true;
      });
      
      signalementMarkers.set(id, marker);
    }
  } catch (error) {
    console.error('Erreur chargement signalements:', error);
  }
}

// Effacer les marqueurs des signalements
function clearSignalements() {
  signalementMarkers.forEach((marker) => {
    if (map) {
      map.removeLayer(marker);
    }
  });
  signalementMarkers.clear();
}

onMounted(async () => {
  if (map || !mapContainer.value) return;

  // Charger l'utilisateur
  loadUserFromStorage();

  // Force explicit dimensions before map init
  mapContainer.value.style.height = '100%';
  mapContainer.value.style.width = '100%';

  map = L.map(mapContainer.value, {
    center: [-18.8792, 47.5079],
    zoom: 13,
    zoomControl: false,
    preferCanvas: true,
    tap: true,
    touchZoom: true,
    inertia: true
  });

  // Ajouter les contrôles zoom en position personnalisée
  L.control.zoom({
    position: 'topleft'
  }).addTo(map);

  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    updateWhenIdle: true,
    updateWhenZooming: false,
    reuseTiles: true,
    keepBuffer: 2
  }).addTo(map);

  tiles.on('loading', () => {
    // placeholder for loader
  });
  tiles.on('load', () => {
    // placeholder for hiding loader
  });

  // Force size recalculation immediately
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 50);

  // Récupérer position de l'utilisateur et ajouter marker
  const pos = await getCurrentPosition();
  if (pos && map) {
    L.circleMarker([pos.lat, pos.lng], {
      radius: 8,
      color: '#4CAF50',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).bindPopup('Ma position').addTo(map);
    
    // Centrer sur l'utilisateur
    map.setView([pos.lat, pos.lng], 15);
  }

  // Charger les signalements existants
  await loadSignalements();

  // Au clic sur la carte
  map.on('click', (e: any) => {
    if (props.isCreating) {
      // Supprimer le marker temporaire précédent
      if (temporaryMarker) {
        map!.removeLayer(temporaryMarker);
      }

      // Créer un nouveau marker temporaire
      temporaryMarker = L.marker([e.latlng.lat, e.latlng.lng])
        .bindPopup('Nouveau signalement')
        .addTo(map!)
        .openPopup();

      // Émettre la localisation
      emit('locationSelected', { lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
});

onIonViewDidEnter(() => {
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 100);
});

// Listen to window resize events too
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  });
}

// Watcher pour réagir au changement du filtre
watch(() => props.filterMySignalements, async () => {
  clearSignalements();
  await loadSignalements();
});

// Watcher pour réagir au changement des filtres de statuts
watch(() => props.filterStatuses, async () => {
  clearSignalements();
  await loadSignalements();
}, { deep: true });

// Exposer les fonctions
defineExpose({ 
  refreshSignalements: loadSignalements
});
</script>

<style scoped>
.map-container {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}

/* Positionner les contrôles zoom sous la navbar à gauche */
:deep(.leaflet-top.leaflet-left) {
  top: 10px !important;
  left: 5px !important;
}

:deep(.leaflet-top.leaflet-right) {
  top: 70px !important;
}

/* Custom Popup Modal Styles */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.popup-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 90%;
  width: 350px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.popup-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  pointer-events: auto;
  z-index: 2001;
}

.popup-close:hover {
  color: #333;
}

@media (max-width: 768px) {
  .popup-content {
    width: 100%;
    max-width: calc(100% - 32px);
    border-radius: 8px;
  }
}

@media (prefers-color-scheme: dark) {
  .popup-overlay {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .popup-content {
    background: #1E293B;
    color: #F3F4F6;
  }

  .popup-close {
    color: #999;
  }

  .popup-close:hover {
    color: #F3F4F6;
  }
}

/* Photo Preview Modal */
.photo-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease;
}

.photo-preview-content {
  position: relative;
  max-width: 95%;
  max-height: 95%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-preview-content .popup-close {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 50%;
}

.photo-preview-content .popup-close:hover {
  background: rgba(255, 255, 255, 1);
}
</style>
