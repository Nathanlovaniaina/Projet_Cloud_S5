# Documentation Technique - front_end_web

## Tâches 37-55 : Frontend Web — Setup, Cartographie, Authentification et Pages

**Version:** 1.0
**Date:** Janvier 2026
**Responsables:** ETU003241, ETU003337, ETU003346, ETU003358

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Scénario 6: Frontend Web](#scénario-6-frontend-web)
3. [Architecture et technologies](#architecture-et-technologies)
4. [Arborescence importante](#arborescence-importante)
5. [Guide d'installation et démarrage](#guide-dinstallation-et-démarrage)
6. [Configuration Vite (proxy)](#configuration-vite-proxy)
7. [Cartographie et tileserver](#cartographie-et-tileserver)
8. [Docker — modes développement et production](#docker--modes-développement-et-production)
9. [Composants clés et flux](#composants-clés-et-flux)
10. [Debugging et vérifications](#debugging-et-vérifications)
11. [Annexes — tâches détaillées (37-55)](#annexes--tâches-détaillées-37-55)

---

## Vue d'ensemble

Le module `front_end_web` est l'application web cliente du projet Signalement Travaux Routiers. Il fournit:
- une interface visiteur pour consulter et créer des signalements,
- une interface manager pour la gestion et l'assignation,
- l'affichage cartographique des signalements via `maplibre-gl` et un tileserver local (tileserver-gl),
- la synchronisation et les appels API vers le backend Spring Boot.

Ce document détaille l'installation, l'architecture, la configuration de développement (Vite + proxy), l'intégration avec Docker, et la liste des tâches front-end (37-55).

## Scénario 6: Frontend Web

Objectifs couverts:
- Initialisation et configuration du projet React (Vite)
- Intégration des librairies cartographiques (MapLibre, Leaflet)
- Composants d'authentification et gestion de session
- Pages visiteur et manager (carte, récapitulatif, gestion)
- Synchronisation hors-ligne et queue asynchrone

## Architecture et technologies

- Langage: TypeScript + React
- Bundler / dev server: Vite
- Cartographie: maplibre-gl (vector tiles), fallback Leaflet
- HTTP client: axios
- Auth: intégration Firebase optionnelle + backend API
- Dev tooling: ESLint, TypeScript

## Arborescence importante

- `public/` — fichiers statiques (firebase config)
- `src/main.tsx` — point d'entrée
- `src/App.tsx` — router et layout
- `src/components/` — composants UI (MapLibreMap, LeafletMap, LoginForm, etc.)
- `src/services/` — communication API, offline queue
- `src/styles/` — styles par page

Voir l'arborescence complète dans le dépôt pour les fichiers détaillés.

## Guide d'installation et démarrage

Prérequis: Node 20+, npm, Docker (pour dev conteneurisé)

Installation et dev local:

```bash
cd front_end_web
npm ci
npm run dev -- --host 0.0.0.0 --port 3000
```

Accès: http://localhost:3000

Scripts principaux (dans `package.json`):
- `dev`: démarre Vite en mode développement
- `build`: `tsc -b && vite build` (production)
- `preview`: `vite preview`
- `lint`: exécute ESLint

## Configuration Vite (proxy)

Fichier: `front_end_web/vite.config.ts`

Proxy de développement configuré pour l'environnement Docker:
- `/api` -> `http://backend:8080` (service Docker `backend`)
- `/styles`, `/data` -> `http://maps_server:80` (service Docker `maps_server`)

Motivation:
- Dans un conteneur, `localhost` fait référence au conteneur lui‑même; utiliser les noms de services Docker (`backend`, `maps_server`) permet la résolution réseau interne.

Extrait de configuration (résumé):

```ts
server: {
  proxy: {
    '/api': { target: 'http://backend:8080', changeOrigin: true },
    '/styles': { target: 'http://maps_server:80', changeOrigin: true },
    '/data': { target: 'http://maps_server:80', changeOrigin: true }
  }
}
```

## Cartographie et tileserver

- En dev local hors conteneur: la carte peut pointer vers `http://localhost:8081`.
- En dev conteneurisé: Vite proxifie `/styles` et `/data` vers `maps_server`.
- Composant principal: `src/components/MapLibreMap.tsx` — utilise maintenant `/styles/osm-bright/style.json` (URL relative proxifiée).

Tileserver:
- Image Docker: `klokantech/tileserver-gl` (service `maps_server` dans `docker-compose.yml`)
- Expose le contenu `/data` contenant les fichiers `.mbtiles` et les styles.

## Docker — modes développement et production

Développement (recommandé pour dev rapide):
- `frontend_web` monte le dossier source et lance `npm ci && npm run dev -- --host 0.0.0.0 --port 3000`.
- Avantage: HMR, édition en direct depuis l'hôte.

Production (build):
- `Dockerfile` multi-stage construit `dist` et l'image Nginx sert `/usr/share/nginx/html`.
- Option: ajouter un service `frontend_prod` dans `docker-compose.yml` si besoin.

## Composants clés et flux

- `MapLibreMap.tsx`: initialisation MapLibre, chargement du style `/styles/...`, gestion des marqueurs.
- `LeafletMap.tsx`: alternative Leaflet (fallback ou tests).
- `LoginForm.tsx` / `RegisterForm.tsx`: UI d'authentification, appelle `/api/auth/*`.
- `services/authService.ts`: wrapper des appels API d'authentification.
- `services/offlineQueue.ts`: queue pour actions hors-ligne et synchronisation.

Flux typique:

1. Le frontend appelle `/api/...` (proxy Vite) → résolu vers `backend:8080` dans Docker.
2. Les requêtes carto `/styles` et `/data` → résolues vers `maps_server:80`.
3. Les données reçues sont affichées via MapLibre et recyclées dans l'UI.

## Debugging et vérifications

- Vérifier services:

```bash
docker compose ps
docker compose logs -f backend maps_server frontend_web
```

- Tester connectivité depuis le conteneur frontend:

```bash
docker compose exec frontend_web sh
apk add --no-cache curl
curl -v http://backend:8080/api/health
curl -v http://maps_server/styles/osm-bright/style.json
```

- Erreurs fréquentes:
  - `ECONNREFUSED` sur le proxy: la cible (`backend` ou `maps_server`) n'est pas démarrée ou n'écoute pas sur le port attendu.
  - Style Map non chargé: vérifier chemin `/styles/...` et existence du style dans `/data` du tileserver.

## Annexes — tâches détaillées (37-55)

Les tâches front-end sont listées et décrites selon la planification du projet (extrait des tâches globales). Elles correspondent aux numéros du planning de projet.

- Tâche 37 — Setup projet React (Vite)
  - **Catégorie**: Frontend Web
  - **Module**: Setup
  - **Tâches**: Initialisation du projet, configuration TypeScript, Vite, ESLint
  - **Qui**: ETU003337
  - **Estimation**: 45h

- Tâche 38 — Intégration Leaflet
  - **Catégorie**: Frontend Web
  - **Module**: Cartes
  - **Tâches**: Installer Leaflet + types, wrapper React-Leaflet
  - **Qui**: ETU003337
  - **Estimation**: 60h

- Tâche 39 — Service connectivité / bascule Firebase
  - **Catégorie**: Frontend Web
  - **Module**: Authentification
  - **Tâches**: Implémenter `useConnectivity` et `connectivityAuthService`
  - **Qui**: ETU003337
  - **Estimation**: 120h

- Tâche 40 — Composant connexion avec bascule
  - **Catégorie**: Frontend Web
  - **Module**: Authentification
  - **Tâches**: UI connexion, fallback Firebase/Backend selon connectivité
  - **Qui**: ETU003337
  - **Estimation**: 180h

- Tâche 41 — Composant inscription
  - **Catégorie**: Frontend Web
  - **Module**: Authentification
  - **Tâches**: Formulaire inscription + validations
  - **Qui**: ETU003241
  - **Estimation**: 150h

- Tâche 42 — Gestion sessions côté client
  - **Catégorie**: Frontend Web
  - **Module**: Authentification
  - **Tâches**: Stockage token, rafraîchissement, logout
  - **Qui**: ETU003241
  - **Estimation**: 120h

- Tâche 43 — Edition profil et sync multi-canal
  - **Catégorie**: Frontend Web
  - **Module**: Authentification
  - **Tâches**: Edit profile, sync Firebase/Postgres
  - **Qui**: ETU003241
  - **Estimation**: 120h

- Tâche 44 — Intégration carte Antananarivo (Leaflet)
  - **Catégorie**: Frontend Web
  - **Module**: Carte
  - **Tâches**: Affichage carte, centre/zoom initial
  - **Qui**: ETU003358
  - **Estimation**: 150h

- Tâche 45 — Affichage marqueurs signalements
  - **Catégorie**: Frontend Web
  - **Module**: Carte
  - **Tâches**: Récupérer signalements, créer marqueurs, clustering éventuel
  - **Qui**: ETU003358
  - **Estimation**: 120h

- Tâche 46 — Survol marqueurs
  - **Catégorie**: Frontend Web
  - **Module**: Carte
  - **Tâches**: Popup, hover, sélection
  - **Qui**: ETU003358
  - **Estimation**: 90h

- Tâche 47 — Page visiteur (map + récap)
  - **Catégorie**: Frontend Web
  - **Module**: Visiteur
  - **Tâches**: Construire la page visiteur avec carte et tableau récapitulatif
  - **Qui**: ETU003346
  - **Estimation**: 150h

- Tâche 48 — Tableau récapitulatif
  - **Catégorie**: Frontend Web
  - **Module**: Visiteur
  - **Tâches**: Table paginée, filtres, tri
  - **Qui**: ETU003346
  - **Estimation**: 120h

- Tâche 49 — Page manager (gestion signalements)
  - **Catégorie**: Frontend Web
  - **Module**: Manager
  - **Tâches**: Liste, recherche, affectation entreprises
  - **Qui**: ETU003241
  - **Estimation**: 180h

- Tâche 50 — Bouton de synchronisation Firebase
  - **Catégorie**: Frontend Web
  - **Module**: Manager
  - **Tâches**: Trigger sync, affichage statut
  - **Qui**: ETU003337
  - **Estimation**: 120h

- Tâche 51 — Page déblocage utilisateurs
  - **Catégorie**: Frontend Web
  - **Module**: Manager
  - **Tâches**: UI pour débloquer utilisateurs
  - **Qui**: ETU003346
  - **Estimation**: 90h

- Tâche 52 — Formulaire édition signalement
  - **Catégorie**: Frontend Web
  - **Module**: Manager
  - **Tâches**: Édition champs signalement
  - **Qui**: ETU003358
  - **Estimation**: 150h

- Tâche 53 — Modification statut signalement
  - **Catégorie**: Frontend Web
  - **Module**: Manager
  - **Tâches**: Changer statut via API
  - **Qui**: ETU003337
  - **Estimation**: 90h

- Tâche 54 — Design responsive
  - **Catégorie**: Frontend Web
  - **Module**: Design
  - **Tâches**: Responsive et styles globaux
  - **Qui**: ETU003337
  - **Estimation**: 180h

- Tâche 55 — Navigation et routing
  - **Catégorie**: Frontend Web
  - **Module**: Design
  - **Tâches**: Menu, routes, protection d'accès
  - **Qui**: ETU003346
  - **Estimation**: 90h

---

## Annexes

- Fichiers de référence:
  - `front_end_web/vite.config.ts`
  - `front_end_web/src/components/MapLibreMap.tsx`
  - `front_end_web/package.json`

- Commandes utiles:

```bash
# Lancer uniquement le frontend en dev via Docker
docker compose up --build -d frontend_web

# Voir les logs
docker compose logs -f frontend_web
```

---

Pour toute modification du réseau Docker (ports, noms de services), mettez à jour `vite.config.ts` et redémarrez `frontend_web`.

Fin de la documentation technique `front_end_web`.
