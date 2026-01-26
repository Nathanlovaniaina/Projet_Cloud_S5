<template>
  <div ref="mapContainer" id="map" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onIonViewDidEnter } from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '@/composables/useGeolocation';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;

export interface Props {
  isCreating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCreating: false
});

const emit = defineEmits<{
  locationSelected: [location: { lat: number; lng: number }];
}>();

let temporaryMarker: L.Marker | null = null;

// Cache pour les types de travail et états
const typeTravailCache = new Map<number, string>();
const etatSignalementCache = new Map<number, string>();

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
        .map(doc => ({
          ...doc.data(),
          timestamp: doc.data().date_changement || 0
        }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      if (historiques.length > 0) {
        const idEtat = historiques[0].id_etat;
        return await getEtatSignalementLibelle(idEtat);
      }
    }
  } catch (error) {
    console.error(`Erreur récupération dernier état pour signalement ${idSignalement}:`, error);
  }
  return 'Non spécifié';
}

async function loadSignalements() {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'signalements')));
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const { latitude, longitude, description, titre, surface_metre_carree, id_type_travail, id } = data;
      
      // Récupérer le type de travail et l'état
      const typeTravail = await getTypeTravailLibelle(id_type_travail);
      const etat = await getDernierEtat(id);
      
      // Construire le contenu de la popup
      const popupContent = `
        <div style="min-width: 280px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #2196F3; font-size: 16px;">${titre || 'Signalement'}</h3>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
          
          <div style="margin-bottom: 8px;">
            <strong>Description:</strong><br/>
            <span style="color: #555; font-size: 13px;">${description || 'Aucune description'}</span>
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Surface:</strong> 
            <span style="color: #2196F3; font-weight: bold;">${surface_metre_carree || 0} m²</span>
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>Type de travail:</strong> 
            <span style="color: #ff9800; font-weight: bold;">${typeTravail}</span>
          </div>
          
          <div>
            <strong>Statut:</strong> 
            <span style="color: #4CAF50; font-weight: bold;">${etat}</span>
          </div>
        </div>
      `;
      
      L.circleMarker([latitude, longitude], {
        radius: 6,
        color: '#2196F3',
        weight: 2,
        fillOpacity: 0.7
      }).bindPopup(popupContent).addTo(map!);
    }
  } catch (error) {
    console.error('Erreur chargement signalements:', error);
  }
}

onMounted(async () => {
  if (map || !mapContainer.value) return;

  // Force explicit dimensions before map init
  mapContainer.value.style.height = '100%';
  mapContainer.value.style.width = '100%';

  map = L.map(mapContainer.value, {
    center: [-18.8792, 47.5079],
    zoom: 13,
    zoomControl: true,
    preferCanvas: true,
    tap: true,
    touchZoom: true,
    inertia: true
  });

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
  map.on('click', (e) => {
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

// Exposer les fonctions
defineExpose({ 
  refreshSignalements: loadSignalements
});
</script>

<style scoped>
.map-container {
  display: block;
  height: 100%;
  width: 100%;
  position: relative;
}

#map {
  display: block;
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
