# Tâche 64 - Implémentation du filtre "Mes signalements uniquement"

## Objectif
Ajouter un bouton/toggle de filtre pour afficher uniquement les signalements créés par l'utilisateur connecté sur la carte mobile.

## Fonctionnalité attendue

L'utilisateur doit pouvoir :
1. **Basculer le filtre** via un bouton ou un toggle dans l'interface
2. **Afficher tous les signalements** par défaut
3. **Afficher seulement ses signalements** quand le filtre est activé
4. **Voir l'état du filtre** clairement dans l'interface (bouton actif/inactif)

## Architecture et données

### Récupération de l'utilisateur connecté

Utiliser le composable `useAuth` pour récupérer l'utilisateur connecté :
```typescript
import { currentUser, loadUserFromStorage } from '@/composables/useAuth';

// L'utilisateur connecté est disponible dans currentUser.value
// Propriétés importantes :
// - currentUser.value.id : L'ID de l'utilisateur
// - currentUser.value.uid : Le UID Firebase
```

### Données dans Firestore

Collection `signalements` avec le champ `id_utilisateur` :
```
signalements/
  {id}/
    ├── id
    ├── titre
    ├── description
    ├── latitude
    ├── longitude
    ├── surface_metre_carree
    ├── id_type_travail
    ├── id_utilisateur  ← Utiliser ce champ pour filtrer
    ├── url_photo
    ├── date_creation
    └── last_update
```

## Implémentation

### Fichiers à modifier

1. **[HomePage.vue](../front_end_mobile/src/views/HomePage.vue)** - Ajouter le bouton de filtre
2. **[Map.vue](../front_end_mobile/src/components/Map.vue)** - Implémenter la logique de filtre

### Étapes

#### 1. Ajouter l'état du filtre dans HomePage.vue

```typescript
import { ref } from 'vue';

// État du filtre
const filterMySignalements = ref(false);

function toggleFilter() {
  filterMySignalements.value = !filterMySignalements.value;
}
```

#### 2. Ajouter le bouton de filtre dans le template

Ajouter un bouton dans la toolbar ou un toggle pour activer/désactiver le filtre :

```vue
<ion-button 
  :color="filterMySignalements ? 'success' : 'medium'"
  @click="toggleFilter"
>
  <ion-icon slot="icon-only" :icon="filterIcon"></ion-icon>
  Mes signalements
</ion-button>
```

Ou un toggle :

```vue
<ion-item>
  <ion-label>Mes signalements uniquement</ion-label>
  <ion-toggle v-model="filterMySignalements"></ion-toggle>
</ion-item>
```

#### 3. Passer le filtre au composant Map

Transmettre l'état du filtre au composant Map :

```vue
<Map 
  ref="mapRef" 
  :is-creating="isCreating"
  :filter-my-signalements="filterMySignalements"
  @location-selected="selectedLocation = $event" 
/>
```

#### 4. Implémenter le filtre dans Map.vue

Ajouter une prop pour recevoir l'état du filtre :

```typescript
export interface Props {
  isCreating?: boolean;
  filterMySignalements?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCreating: false,
  filterMySignalements: false
});
```

#### 5. Modifier la fonction loadSignalements()

Adapter la fonction pour filtrer les signalements selon le filtre actif :

```typescript
async function loadSignalements() {
  try {
    // Charger tous les signalements
    const querySnapshot = await getDocs(query(collection(db, 'signalements')));
    
    // Filtrer en JavaScript si le filtre est actif
    const signalementsFiltres = props.filterMySignalements 
      ? querySnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.id_utilisateur === currentUser.value?.id;
        })
      : querySnapshot.docs;
    
    // Afficher les signalements filtrés
    for (const doc of signalementsFiltres) {
      const data = doc.data();
      // ... reste du code d'affichage
    }
  } catch (error) {
    console.error('Erreur chargement signalements:', error);
  }
}
```

#### 6. Actualiser la carte quand le filtre change

Ajouter un watcher pour recharger les signalements quand le filtre change :

```typescript
import { watch } from 'vue';

// Effacer les marqueurs existants
function clearSignalements() {
  if (map) {
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker && layer !== userMarker) {
        map!.removeLayer(layer);
      }
    });
  }
}

// Recharger quand le filtre change
watch(() => props.filterMySignalements, async () => {
  clearSignalements();
  await loadSignalements();
});
```

## Interface utilisateur

### Option 1 : Bouton dans la toolbar
```
┌─────────────────────────────────────────┐
│ Carte Signalements    [+] [🔘 Mes sig]  │
└─────────────────────────────────────────┘
```

Le bouton change de couleur :
- **Gris/Medium** : Tous les signalements visibles
- **Vert/Success** : Uniquement mes signalements visibles

### Option 2 : Toggle dans un menu
```
┌─────────────────────────────────────────┐
│ Carte Signalements    [≡ Menu]          │
└─────────────────────────────────────────┘

Menu déroulant :
[☐] Mes signalements uniquement
```

### Option 3 : Toggle intégré dans le contenu
```
┌─────────────────────────────────────────┐
│ Mes signalements [●─────] Tous          │
└─────────────────────────────────────────┘
```

## Comportement attendu

1. **État initial** : Tous les signalements sont affichés
2. **Activation du filtre** : 
   - Les marqueurs des signalements d'autres utilisateurs disparaissent
   - Les marqueurs personnels restent visibles
3. **Désactivation du filtre** : 
   - Tous les signalements réapparaissent
4. **Création d'un signalement** : 
   - Si le filtre est actif, le nouveau signalement apparaît immédiatement
   - Si inactif, on peut voir le nouveau marqueur en même temps que les autres

## Optimisations possibles

- **Distinction visuelle** : Utiliser des couleurs différentes pour ses signalements (exemple : rouge) vs ceux des autres (bleu)
- **Compteur** : Afficher le nombre de signalements affichés vs le total
- **Persistance** : Mémoriser l'état du filtre dans le localStorage
- **Animation** : Animer l'apparition/disparition des marqueurs

## Notes techniques

- Importer `currentUser` du composable `useAuth`
- Appeler `loadUserFromStorage()` dans `onMounted` pour charger l'utilisateur
- Utiliser `watch()` pour détecter les changements du filtre
- Éviter les requêtes multiples, filtrer en JavaScript côté client
- Le champ `id_utilisateur` doit correspondre à `currentUser.value.id`
