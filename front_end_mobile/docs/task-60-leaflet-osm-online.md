# Tâche 60 — Intégration de Leaflet avec OpenStreetMap en ligne

## État actuel
✅ **Task 58 complétée** :
- Leaflet installé (`npm install leaflet`)
- Composant `src/components/Map.vue` créé
- OpenStreetMap tiles déjà intégrées et fonctionnelles
- Carte centrée sur Antananarivo (-18.8792°, 47.5079°)

## Ce qui manque pour Task 60
Task 60 = valider et améliorer l'intégration OSM en ligne pour mobile.

### 1) Vérifier que ça marche
```bash
cd front_end_mobile
npm run dev
# Ouvrir http://localhost:5173/home
# Vérifier que la carte charge les tuiles OSM correctement
```

### 2) Ajouter les fonctionnalités essentielles
- ✅ Zoom/pan sur la carte
- ✅ Attribution OSM affichée
- ➕ Tester sur téléphone (Capacitor)
- ➕ Optimiser la hauteur/CSS pour mobile

### 3) Builder et synchroniser (important pour mobile)
```bash
npm run build
npx cap sync
# Ouvrir Android Studio ou Xcode et tester sur l'émulateur/appareil
```

### 4) Points de vérification
- [ ] Carte charge correctement avec tuiles OSM
- [ ] Zooms/pans fonctionnent au tactile
- [ ] Attribution `© OpenStreetMap` visible
- [ ] Pas d'erreurs console
- [ ] Fonctionne sur Capacitor (Android/iOS)

### 5) Notes
- Les icônes des marqueurs sont chargées depuis CDN (leaflet.cloudflare.com)
- Mode offline requiert service worker (Task 34-36 pour serveur tiles local)
- La tâche suivante (Task 61) ajoutera géolocalisation et marqueurs signalements

## Ressources
- OpenStreetMap : https://www.openstreetmap.org/copyright
- Leaflet docs : https://leafletjs.com/
