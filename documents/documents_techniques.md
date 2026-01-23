# Documentation Technique - Projet Signalement Travaux Routiers
## Tâches 1-26: Infrastructure, Authentification et Gestion des Signalements

**Version:** 2.0  
**Date:** Janvier 2026  
**Responsables:** ETU003241, ETU003346, ETU003337, ETU003358

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Scénario 1: Setup Initial](#scénario-1-setup-initial)
3. [Scénario 2: Infrastructure - Base de Données](#scénario-2-infrastructure---base-de-données)
4. [Scénario 3: Backend - Authentification](#scénario-3-backend---authentification)
5. [Scénario 4: Backend - Gestion des Signalements](#scénario-4-backend---gestion-des-signalements)
6. [Architecture Globale](#architecture-globale)
7. [Guide d'Installation et Démarrage](#guide-dinstallation-et-démarrage)

---

## Vue d'ensemble

Le projet **Signalement Travaux Routiers** est une application full-stack permettant aux citoyens de signaler des problèmes routiers et aux managers de gérer ces signalements. 

Les tâches 1-26 couvrent:
- ✅ Configuration du repository GitHub et infrastructure Docker
- ✅ Configuration de la base de données PostgreSQL avec PostGIS
- ✅ Implémentation complète du système d'authentification et des sessions
- ✅ APIs REST pour la gestion complète des signalements (CRUD)
- ✅ Standardisation des réponses API avec ApiResponse wrapper
- ✅ Refonte complète de la base de données avec historique d'états
- ✅ Gestion des états via table d'audit (historique_etat_signalement)

---

## Scénario 1: Setup Initial

### Tâche 1 & 2: Configuration du Repository et Docker

#### Tâche 1: Configuration Repository Git
- **Responsable:** ETU003241
- **Type:** Configuration
- Initialisation du repository GitHub public
- Setup des branches principales (main, develop)
- Définition des règles de contribution

#### Tâche 2: Structure Docker
- **Responsable:** ETU003241  
- **Type:** Configuration
- Création du `docker-compose.yml`
- Configuration des services:
  - **PostgreSQL**: Base de données principale
  - **Backend Spring Boot**: API REST
  - **Frontend Web**: Application React (optionnel pour cette phase)

**Structure du docker-compose.yml:**

```yaml
services:
  db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: signalement
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/postgresql/data
  
  backend:
    build: ./back_end
    ports:
      - "8080:8080"
    depends_on:
      - db
```

**Screenshot de la structure du projet:**
```
[Insérer screenshot du workspace structure ici]
```

---

## Scénario 2: Infrastructure - Base de Données

### Tâche 3 & 4: Configuration PostgreSQL et Conception

#### Tâche 3: Container PostgreSQL
- **Responsable:** ETU003346
- **Type:** Configuration
- Configuration du container PostGIS (PostgreSQL + extensions géospatiales)
- Setup des volumes de persistence
- Initialisation avec les scripts SQL

#### Tâche 4: Modèle Conceptuel de Données (MCD)
- **Responsable:** ETU003346
- **Type:** Conception

**Screenshot du MCD:**
```
[Insérer screenshot du diagramme MCD ici]
```

### Tâches 5, 6, 7: Création des Tables

#### Tâche 5: Tables Utilisateurs
- **Responsable:** ETU003358
- **Type:** Développement

#### Tâche 6: Tables Signalements
- **Responsable:** ETU003358
- **Type:** Développement

#### Tâche 7: Tables Tentatives Connexion
- **Responsable:** ETU003358
- **Type:** Développement

---

## Scénario 3: Backend - Authentification

### Tâches 8-10: Setup et Configuration Backend

#### Tâche 8: Setup Spring Boot
- **Responsable:** ETU003337
- **Type:** Configuration
- Framework: Spring Boot 3.2.1
- Dépendances principales:
  - Spring Data JPA
  - Spring Web
  - PostgreSQL Driver
  - Lombok

#### Tâche 9: Configuration Firebase
- **Responsable:** ETU003337
- **Type:** Configuration
- Configuration Firebase pour authentification optionnelle
- Setup des clés API

#### Tâche 10: Connexion PostgreSQL
- **Responsable:** ETU003337
- **Type:** Développement

**Configuration application.properties:**
screen

### Tâches 11-18: Développement des APIs d'Authentification

#### Architecture du Système d'Authentification

```
Request HTTP
    ↓
SessionFilter (vérification du token)
    ↓
AuthenticationController (routage)
    ↓
AuthenticationService (logique métier)
    ↓
Repositories (accès DB)
    ↓
Response JSON
```

#### Tâche 11 & 12: API d'Inscription et Authentification

**Responsables:** ETU003241  
**Type:** Développement (150h + 150h)

##### Endpoint 1: POST /api/auth/register

**Inscription d'un nouvel utilisateur**

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "motDePasse": "SecurePassword123",
  "nom": "Dupont",
  "prenom": "Jean",
  "typeUtilisateur": "VISITOR"
}
```

**Réponse (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "typeUtilisateur": "VISITOR",
  "message": "Utilisateur créé avec succès"
}
```

**Validations:**
- Email format correct et unique
- Mot de passe au minimum 8 caractères
- Champs obligatoires présents
- Hash du mot de passe avec BCrypt

---

##### Endpoint 2: POST /api/auth/login

**Authentification de l'utilisateur**

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "motDePasse": "SecurePassword123"
}
```

**Réponse (200 OK):**
```json
{
  "token": "abc123xyz789...",
  "utilisateurId": 1,
  "email": "user@example.com",
  "typeUtilisateur": "VISITOR",
  "message": "Connexion réussie"
}
```

**Sécurité:**
- Vérification du mot de passe avec BCrypt
- Limite de 3 tentatives échouées
- Blocage automatique après 3 échecs
- Génération d'un token de session (24h validité)

**Screenshot du login réussi:**
```
[Insérer screenshot ici]
```

---

#### Tâche 13: Gestion des Sessions

**Responsable:** ETU003241  
**Type:** Développement

**Logique de Session:**
- Création d'une session lors du login réussi
- Token généré aléatoirement (UUID)
- Validité: 24 heures
- Vérification du token à chaque requête via `SessionFilter`
- Invalidation à la déconnexion

---

#### Tâche 14: Modification des Informations Utilisateur

**Responsable:** ETU003337  
**Type:** Développement

##### Endpoint 3: PUT /api/auth/utilisateur/{id}

**Modification des données utilisateur**

```
PUT /api/auth/utilisateur/1
Authorization: Bearer [token]
Content-Type: application/json

{
  "nom": "Martin",
  "prenom": "Sophie",
  "email": "sophie.martin@example.com"
}
```

**Réponse (200 OK):**
```json
{
  "id": 1,
  "email": "sophie.martin@example.com",
  "nom": "Martin",
  "prenom": "Sophie",
  "typeUtilisateur": "VISITOR",
  "message": "Profil mis à jour avec succès"
}
```

**Sécurité:**
- Authentification requise (token dans l'en-tête)
- Chaque utilisateur ne peut modifier que son propre profil
- Managers peuvent modifier d'autres utilisateurs

---

#### Tâche 15: Limite de Tentatives de Connexion

**Responsable:** ETU003241  
**Type:** Développement

**Logique de Protection:**

```
1ère tentative échouée → Message d'erreur standard
2e tentative échouée → Message d'erreur standard
3e tentative échouée → Compte bloqué, email envoyé

Blocked User:
- est_bloque = true
- Ne peut plus se connecter
- Attendre déblocage par un Manager
```

**Screenshot du compte bloqué:**
```
[Insérer screenshot ici]
```

---

#### Tâche 16: Déblocage d'Utilisateur

**Responsable:** ETU003346  
**Type:** Développement

##### Endpoint 4: POST /api/auth/debloquer/{userId}

**Déblocage d'un utilisateur (Manager uniquement)**

```
POST /api/auth/debloquer/2
Authorization: Bearer [token_manager]
```

**Réponse (200 OK):**
```json
{
  "id": 2,
  "email": "user@example.com",
  "estBloque": false,
  "message": "Utilisateur débloqué avec succès"
}
```

**Sécurité:**
- Authentification requise
- Seuls les MANAGERS peuvent débloquer
- Tentatives de connexion réinitialisées

---

#### Tâche 17 & 18: Documentation Swagger

**Responsables:** ETU003346  
**Type:** Configuration et Documentation

**Accès Swagger:**
```
URL: http://localhost:8080/swagger-ui.html
```

**Screenshot de Swagger UI:**
```
[Insérer screenshot ici]
```

---

## Architecture Globale

### Flux d'Authentification

```
┌─────────────────────────────────────────────────────┐
│  Utilisateur (Frontend)                             │
└───────────────┬─────────────────────────────────────┘
                │
                │ POST /api/auth/login
                ↓
        ┌───────────────────┐
        │  Spring Security  │
        │   + Password      │
        │   Encoder         │
        └───────────┬───────┘
                    │
                    ↓
        ┌─────────────────────────┐
        │  AuthenticationService  │
        │  - Vérifier credentials │
        │  - Vérifier blocage     │
        │  - Vérifier tentatives  │
        └───────────┬─────────────┘
                    │
                    ↓
        ┌─────────────────────────┐
        │  Créer Session          │
        │  Générer Token          │
        │  Retourner Token        │
        └───────────┬─────────────┘
                    │
                    ↓
        ┌──────────────────────────┐
        │  Utilisateur reçoit Token │
        │  Le stocke localement     │
        └──────────────────────────┘

Requêtes Ultérieures:
┌────────────────────────────────┐
│  Authorization: Bearer [TOKEN]  │
└───────────────┬────────────────┘
                │
                ↓
        ┌──────────────────────┐
        │  SessionFilter       │
        │  Valide le Token     │
        │  Vérifie l'expiration│
        └───────────┬──────────┘
                    │ ✓ Valide
                    ↓
        Requête autorisée
```

---

## Technologies Utilisées

### Backend
| Technologie | Version | Rôle |
|-----------|---------|------|
| Java | 17+ | Langage principal |
| Spring Boot | 3.2.1 | Framework web |
| Spring Data JPA | 3.2.1 | ORM et repositories |
| Hibernate ORM | 6.4.1 | Implémentation JPA |
| Hibernate Spatial | 6.4.1 | Support géospatial |
| PostgreSQL | 42.6.0 (driver) | Base de données |
| PostGIS | 3.3 | Données géospatiales |
| JTS (LocationTech) | Latest | Géométries Point |
| Jackson | 2.15.3 | Sérialisation JSON |
| Lombok | 1.18.30 | Réduction boilerplate |
| BCrypt | Latest | Hashage mots de passe |
| Swagger/OpenAPI | Latest | Documentation API |
| Maven | 3.x | Build management |

### Infrastructure
| Service | Image | Rôle |
|---------|-------|------|
| PostgreSQL | postgis/postgis:15-3.3 | Base de données |
| Docker | Latest | Containerisation |
| Docker Compose | Latest | Orchestration |

---

## Guide d'Installation et Démarrage

### Prérequis
- Docker et Docker Compose installés
- Java 17+ pour développement local
- Maven 3.8+
- Git

### Démarrage avec Docker

```bash
# 1. Cloner le repository
git clone https://github.com/[user]/Projet_Cloud_S5.git
cd Projet_Cloud_S5

# 2. Démarrer les services
docker-compose up -d

# 3. Attendre l'initialisation (30-60 secondes)
docker-compose logs -f

# 4. Vérifier l'état
docker-compose ps
```

**Ports accessibles:**
- API Backend: http://localhost:8080
- PostgreSQL: localhost:5432 (admin / password)
- Swagger UI: http://localhost:8080/swagger-ui.html

### Démarrage en Développement Local

```bash
# 1. Démarrer PostgreSQL
docker-compose up -d db

# 2. Ouvrir un terminal dans back_end/
cd back_end

# 3. Lancer l'application
mvn spring-boot:run
```

---

## Problèmes Rencontrés et Solutions

### 1. Erreur de Serialization Hibernate
**Problème:** Erreur Jackson avec les objets Hibernate proxy
**Solution:** Création de DTOs et ajout de `@JsonIgnoreProperties`

### 2. Port 5432 Déjà Utilisé
**Problème:** PostgreSQL local en conflit avec Docker
**Solution:** Changement du port dans docker-compose ou arrêt du service local

### 3. Session Filter Bloquant les Endpoints d'Authentification
**Problème:** Les endpoints /api/auth/* étaient bloqués par le filtre
**Solution:** Configuration du filtre pour ignorer les chemins d'authentification

---

## Statistiques du Travail Réalisé

| Catégorie | Tâches | Heures estimées | Statut |
|-----------|--------|----------------|--------|
| Infrastructure | 1-2 | 1.5h | ✅ Complété |
| Base de Données Initiale | 3-7 | 6.75h | ✅ Complété |
| Backend Authentification | 8-18 | 21.5h | ✅ Complété |
| APIs Signalements CRUD | 19-23 | 480h | ✅ Complété |
| Standardisation API | 24 | 60h | ✅ Complété |
| Refonte Base de Données | 25 | 180h | ✅ Complété |
| Mise à Jour Entités | 26 | 150h | ✅ Complété |
| **TOTAL** | **26** | **~900h** | **✅ COMPLÉTÉ** |
Scénario 4: Backend - Gestion des Signalements

### Tâches 19-23: APIs CRUD pour Signalements

#### Vue d'ensemble du Module Signalements

Le module de gestion des signalements permet aux utilisateurs de créer, consulter, modifier et suivre l'évolution des signalements de travaux routiers. Chaque signalement contient des informations géospatiales précises avec support PostGIS.

#### Tâche 19: Création d'un Signalement

**Responsable:** ETU003337  
**Type:** Développement (120h)

**Endpoint:** POST /api/signalements

**Fonctionnalités:**
- Création de signalement avec coordonnées GPS (latitude/longitude)
- Validation automatique des coordonnées (limites Madagascar)
- Conversion automatique en géométrie Point PostGIS (SRID 4326)
- Surface obligatoire en mètres carrés
- Création automatique d'un historique d'état initial ("En attente")
- Association automatique à l'utilisateur authentifié

**Validations:**
- Titre obligatoire (non vide)
- Latitude: entre -25.6 et -11.9 (Madagascar)
- Longitude: entre 43.2 et 50.5 (Madagascar)
- Surface: minimum 0.01 m²
- Type de travail optionnel

**Réponse:** ApiResponse avec le signalement créé (201 Created)

---

#### Tâche 20: Liste de Tous les Signalements

**Responsable:** ETU003337  
**Type:** Développement (90h)

**Endpoint:** GET /api/signalements

**Fonctionnalités:**
- Liste complète de tous les signalements
- Filtrage optionnel par état actuel (etatId)
- Filtrage optionnel par type de travail (typeTravauxId)
- Enrichissement automatique avec état actuel et libellé
- Enrichissement avec type de travail et libellé

**Filtres disponibles:**
- etatId: Filtre par état actuel (1=En attente, 2=En cours, 3=Résolu, 4=Rejeté)
- typeTravauxId: Filtre par type de travail

**Réponse:** ApiResponse avec tableau de signalements enrichis

---

#### Tâche 21: Signalements de l'Utilisateur Connecté

**Responsable:** ETU003337  
**Type:** Développement (60h)

**Endpoint:** GET /api/me/signalements

**Fonctionnalités:**
- Liste des signalements créés par l'utilisateur authentifié
- Authentification obligatoire (token requis)
- Enrichissement automatique avec états et types

**Sécurité:**
- Token de session validé via SessionFilter
- Seuls les signalements de l'utilisateur connecté sont retournés

**Réponse:** ApiResponse avec tableau de signalements de l'utilisateur

---

#### Tâche 22: Modification d'un Signalement

**Responsable:** ETU003337  
**Type:** Développement (120h)

**Endpoint:** PUT /api/signalements/{id}

**Fonctionnalités:**
- Modification complète des informations d'un signalement
- Modification du titre, description, coordonnées, surface
- Modification du type de travail
- Mise à jour automatique du champ last_update

**Autorisations:**
- Créateur du signalement: peut modifier son propre signalement
- Manager: peut modifier n'importe quel signalement

**Champs modifiables:**
- titre, description, latitude, longitude, surfaceMetreCarree, urlPhoto, idTypeTravail

**Réponse:** ApiResponse avec le signalement mis à jour (200 OK)

---

#### Tâche 23: Changement d'État d'un Signalement

**Responsable:** ETU003337  
**Type:** Développement (90h)

**Endpoint:** PATCH /api/signalements/{id}/status

**Fonctionnalités:**
- Changement de l'état actuel d'un signalement
- Création automatique d'une entrée dans l'historique
- Traçabilité complète des changements d'état

**Autorisations:**
- Réservé aux MANAGERS uniquement

**États disponibles:**
- 1: En attente
- 2: En cours
- 3: Résolu
- 4: Rejeté

**Historique automatique:**
- Chaque changement d'état crée une nouvelle ligne dans historique_etat_signalement
- Date de changement enregistrée automatiquement
- Permet de tracer l'évolution complète du signalement

**Réponse:** ApiResponse avec le signalement mis à jour et nouvel état

---

### Tâche 24: Standardisation des Réponses API

**Responsable:** ETU003337  
**Type:** Refactoring (60h)

**Objectif:**
Uniformiser toutes les réponses API avec un format standard ApiResponse pour faciliter l'intégration frontend.

**Format ApiResponse:**
- success (boolean): Indique si la requête a réussi
- message (string): Message descriptif du résultat
- data (T): Les données de la réponse (nullable)

**Endpoints standardisés:**
- Tous les endpoints d'authentification
- Tous les endpoints de signalements (POST, GET, PUT, PATCH)
- Gestion cohérente des erreurs avec success=false

**Avantages:**
- Parsing uniforme côté frontend
- Gestion d'erreurs simplifiée
- Meilleure documentation API
- Compatibilité avec tous les clients HTTP

---

### Tâches 25-26: Refonte de la Base de Données

#### Tâche 25: Modification de la Structure de Base de Données

**Responsable:** ETU003337  
**Type:** Infrastructure (180h)

**Modifications majeures:**

**1. Ajout du champ last_update partout:**
- Toutes les tables ont maintenant un champ last_update (TIMESTAMP NOT NULL)
- Mise à jour automatique via callbacks JPA (@PrePersist, @PreUpdate)
- Traçabilité complète des modifications

**2. Correction des types de données:**
- Latitude/Longitude: NUMERIC(15,10) au lieu de TEXT
- Surface: NUMERIC(15,2) pour les mètres carrés
- Montants: NUMERIC(15,2) pour les montants financiers

**3. Nouvelles tables créées:**
- synchronisation_firebase: Gestion de la sync avec Firebase
- entreprise_concerner: Association signalement-entreprise avec dates début/fin
- historique_etat_signalement: Audit trail complet des changements d'état
- historique_statut_assignation: Audit trail des changements de statut d'assignation

**4. Suppression des champs obsolètes:**
- Signalement: suppression de id_etat_signalement (FK directe)
- Signalement: suppression de synced, last_sync (remplacé par table synchronisation)

**5. Architecture d'audit:**
- Les états ne sont plus stockés en FK directe sur signalement
- Utilisation d'une table d'historique pour tracer tous les changements
- L'état actuel = entrée la plus récente dans l'historique
- Permet de connaître l'historique complet: qui a changé quoi et quand

**6. Support géospatial amélioré:**
- Type GEOGRAPHY(Point, 4326) pour les coordonnées
- Index spatiaux pour les requêtes géographiques
- Support complet PostGIS 3.3

---

#### Tâche 26: Mise à Jour des Entités JPA

**Responsable:** ETU003337  
**Type:** Développement (150h)

**Entités mises à jour (11 au total):**

**1. Signalement:**
- Ajout: surfaceMetreCarree, last_update, geom (Point)
- Type corrigé: latitude/longitude en BigDecimal(15,10)
- Suppression: etatActuel FK, synced, lastSync
- Lifecycle: @PrePersist pour dateCreation et lastUpdate

**2. HistoriqueEtatSignalement (NOUVELLE):**
- Champs: idHistorique, dateChangement, lastUpdate, signalement FK, etatSignalement FK
- Lifecycle: @PrePersist pour dateChangement et lastUpdate
- Rôle: Tracer tous les changements d'état

**3. Utilisateur:**
- Ajout: last_update avec lifecycle callbacks
- Relations: OneToMany avec Signalement et Session

**4. EtatSignalement:**
- Ajout: last_update
- Suppression de la relation OneToMany vers Signalement

**5. TypeTravail:**
- Ajout: last_update
- Relations maintenues avec Signalement

**6. Entreprise:**
- Ajout: last_update
- Relations: OneToMany avec EntrepriseConcerner

**7. EntrepriseConcerner (NOUVELLE):**
- Champs: dateCreation, montant, dateDebut, dateFin, lastUpdate
- Relations: ManyToOne vers Signalement et Entreprise
- Rôle: Gérer l'assignation d'entreprises aux signalements

**8. Session:**
- Ajout: last_update
- Relation ManyToOne vers Utilisateur maintenue

**9-11. Autres tables:**
- TypeUtilisateur, StatutAssignation, SynchronisationFirebase
- Toutes avec last_update et lifecycle callbacks

**Architecture de Service mise à jour:**

**SignalementService:**
- createSignalementForUser(): Crée signalement + historique initial
- updateSignalement(): Modifie les infos (pas l'état)
- updateSignalementStatus(): Change l'état via historique
- getCurrentEtat(): Récupère l'état actuel depuis l'historique
- convertToEnrichedDTO(): Enrichit le DTO avec état actuel et libellés
- createHistoriqueEtat(): Crée une entrée d'historique

**Repositories créés:**
- HistoriqueEtatSignalementRepository: Requêtes d'historique
- EntrepriseConcernerRepository: Gestion des assignations

**Pattern d'Audit:**
- Tous les changements d'état sont enregistrés
- Table d'historique ordonnée par date (DESC)
- État actuel = première entrée de l'historique
- Pas de suppression d'historique (audit permanent)

---

### Architecture du Système de Gestion d'État

**Ancien système (avant tâche 25):**
```
Signalement → id_etat_signalement FK → EtatSignalement
(État stocké directement, pas d'historique)
```

**Nouveau système (après tâche 25):**
```
Signalement ← historique_etat_signalement → EtatSignalement
              (date_changement DESC)
              
État actuel = SELECT TOP 1 FROM historique 
              WHERE id_signalement = X 
              ORDER BY date_changement DESC
```

**Avantages:**
- Historique complet des changements d'état
- Traçabilité: qui a changé quoi et quand
- Possibilité d'analyse temporelle
- Audit trail permanent
- Restauration possible d'états antérieurs

---

### Flux de Création et Modification de Signalement

**Création (POST /api/signalements):**
```
1. Validation des données (coordonnées, surface, titre)
2. Création de l'entité Signalement
3. Génération de la géométrie Point PostGIS
4. Sauvegarde du signalement
5. Création automatique d'un historique "En attente"
6. Retour du signalement enrichi avec état
```

**Modification d'état (PATCH /status):**
```
1. Vérification: Manager uniquement
2. Vérification: Signalement existe
3. Vérification: État cible existe
4. Création d'une nouvelle entrée d'historique
5. Retour du signalement avec nouvel état actuel
```

**Consultation (GET /api/signalements):**
```
1. Récupération de tous les signalements
2. Filtrage optionnel par état ou type
3. Pour chaque signalement:
   - Récupération de l'état actuel depuis l'historique
   - Enrichissement du DTO avec libellés
4. Retour de la liste enrichie
```

---

## Prochaines Étapes (Tâches 27+)

Les tâches 27-28 couvriront:
- API d'assignation de signalements aux entreprises (Manager)
- API de modification du statut d'assignation (Manager)
- Gestion des dates de début et fin de travaux

Les tâches 29+ couvriront:
- Synchronisation avec Firebase
- Récapitulatif/Statistiques
- Frontend web et mobile
- APIs de Gestion des Signalements (CRUD)
- Synchronisation avec Firebase
- Récapitulatif/Statistiques

---

## Contacts et Support1 Janvier 2026  
**Status:** En production pour tâches 1-26  
**Prochaine phase:** Tâches 27-28 (Assignation entreprises)
Pour toute question concernant les tâches 1-18:
- Backend: ETU003241, ETU003337, ETU003346, ETU003358
- Documentation: Voir ce document
- Repository: GitHub 

---

**Dernière mise à jour:** 20 Janvier 2026  
**Status:** En production pour tâches 1-18
