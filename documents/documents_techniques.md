# Documentation Technique - Projet Signalement Travaux Routiers
## Tâches 1-18: Infrastructure et Authentification

**Version:** 1.0  
**Date:** Janvier 2026  
**Responsables:** ETU003241, ETU003346, ETU003337, ETU003358

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Scénario 1: Setup Initial](#scénario-1-setup-initial)
3. [Scénario 2: Infrastructure - Base de Données](#scénario-2-infrastructure---base-de-données)
4. [Scénario 3: Backend - Authentification](#scénario-3-backend---authentification)
5. [Architecture Globale](#architecture-globale)
6. [Guide d'Installation et Démarrage](#guide-dinstallation-et-démarrage)

---

## Vue d'ensemble

Le projet **Signalement Travaux Routiers** est une application full-stack permettant aux citoyens de signaler des problèmes routiers et aux managers de gérer ces signalements. 

Les tâches 1-18 couvrent:
- ✅ Configuration du repository GitHub
- ✅ Mise en place de l'infrastructure Docker
- ✅ Configuration de la base de données PostgreSQL
- ✅ Implémentation complète du système d'authentification et des sessions

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
| Spring Data JPA | Latest | ORM |
| PostgreSQL | 15 | Base de données |
| PostGIS | 3.3 | Données géospatiales |
| Lombok | Latest | Réduction boilerplate |
| BCrypt | Latest | Hashage mots de passe |
| Swagger/OpenAPI | Latest | Documentation API |

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

| Catégorie | Tâches | Minutes passées | Heures passées | Statut |
|-----------|--------|----------------|----------------|--------|
| Infrastructure | 1-2 | 90 min | 1.5h | ✅ Complété |
| Base de Données | 3-7 | 405 min | 6.75h | ✅ Complété |
| Backend Auth | 8-18 | 1290 min | 21.5h | ✅ Complété |
| **TOTAL** | **18** | **1785 min** | **29.75h** | **✅ COMPLÉTÉ** |

---

## Prochaines Étapes (Tâches 19+)

Les tâches 19-26 couvriront:
- APIs de Gestion des Signalements (CRUD)
- Synchronisation avec Firebase
- Récapitulatif/Statistiques

---

## Contacts et Support

Pour toute question concernant les tâches 1-18:
- Backend: ETU003241, ETU003337, ETU003346, ETU003358
- Documentation: Voir ce document
- Repository: GitHub 

---

**Dernière mise à jour:** 20 Janvier 2026  
**Status:** En production pour tâches 1-18
