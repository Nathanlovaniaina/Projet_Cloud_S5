# Documentation Technique - Système de Signalement de Travaux Routiers

**Version:** 3.0  
**Date:** Février 2026  
**Équipe de développement:** ETU003241, ETU003346, ETU003337, ETU003358

---

## Table des Matières

1. [Introduction](#1-introduction)
   - 1.1 [Contexte du Projet](#11-contexte-du-projet)
   - 1.2 [Objectif du Document](#12-objectif-du-document)
   - 1.3 [Périmètre du Document](#13-périmètre-du-document)
   - 1.4 [Public Cible](#14-public-cible)
   - 1.5 [Définitions et Acronymes](#15-définitions-et-acronymes)
2. [Contexte & Besoins](#2-contexte--besoins)
   - 2.1 [Problématique à résoudre](#21-problématique-à-résoudre)
   - 2.2 [Contraintes](#22-contraintes)
   - 2.3 [Exigences fonctionnelles](#23-exigences-fonctionnelles)
3. [Architecture générale](#3-architecture-générale)
   - 3.1 [Vue d'ensemble du système](#31-vue-densemble-du-système)
   - 3.2 [Schéma d'architecture](#32-schéma-darchitecture)
   - 3.3 [Technologies utilisées](#33-technologies-utilisées)
   - 3.4 [Environnements](#34-environnements)
4. [Description fonctionnelle](#4-description-fonctionnelle)
   - 4.1 [Cas d'utilisation](#41-cas-dutilisation)
   - 4.2 [Parcours utilisateur](#42-parcours-utilisateur)
   - 4.3 [Règles de gestion](#43-règles-de-gestion)
5. [Modélisation des Données](#5-modélisation-des-données)
   - 5.1 [Modèle Conceptuel de Données (MCD)](#51-modèle-conceptuel-de-données-mcd)
   - 5.2 [Tables Principales](#52-tables-principales)
   - 5.3 [Tables de Référence](#53-tables-de-référence)
   - 5.4 [Table de Synchronisation](#54-table-de-synchronisation)
6. [Sécurité et Authentification](#6-sécurité-et-authentification)
   - 6.1 [Authentification / autorisation](#61-authentification--autorisation)
   - 6.2 [Gestion des rôles et droits](#62-gestion-des-rôles-et-droits)
   - 6.3 [Protection des données](#63-protection-des-données)
   - 6.4 [Logs et traçabilité](#64-logs-et-traçabilité)
7. [Installation et Déploiement](#7-installation-et-déploiement)
   - 7.1 [Prérequis système](#71-prérequis-système)
   - 7.2 [Déploiement avec Docker Compose](#72-déploiement-avec-docker-compose)
   - 7.3 [Accès aux applications](#73-accès-aux-applications)
   - 7.4 [Application Mobile](#74-application-mobile)
   - 7.5 [Configuration Firebase](#75-configuration-firebase)
   - 7.6 [Dépannage](#76-dépannage)
8. [Conclusion et Améliorations](#8-conclusion-et-améliorations)
   - 8.1 [Bilan du Projet](#81-bilan-du-projet)
   - 8.2 [Fonctionnalités Réalisées](#82-fonctionnalités-réalisées)
   - 8.3 [Améliorations Futures](#83-améliorations-futures)
   - 8.4 [Impact et Valeur Ajoutée](#84-impact-et-valeur-ajoutée)
9. [Annexes](#9-annexes)
   - 9.1 [Liens et Ressources](#91-liens-et-ressources)
   - 9.2 [Technologies et Versions](#92-technologies-et-versions)
   - 9.6 [Contacts et Support](#96-contacts-et-support)

---

## 1. Introduction

### 1.1 Contexte du Projet

Le système de **Signalement de Travaux Routiers** est une application full-stack conçue pour améliorer la gestion des infrastructures routières à Madagascar. Il permet aux citoyens de signaler les problèmes routiers et aux gestionnaires municipaux de superviser les réparations.

### 1.2 Objectif du Document

Ce document technique vise à démontrer la maîtrise technique, justifier les choix architecturaux, faciliter la maintenance et servir de référence pour les développeurs futurs.

### 1.3 Périmètre du Document

**Couvre :** Architecture générale, choix technologiques, modélisation des données, mécanismes de sécurité.

### 1.4 Public Cible

- **Développeurs** : Comprendre l'architecture et contribuer au code
- **Administrateurs** : Déployer et maintenir l'infrastructure  
- **Décideurs** : Évaluer la viabilité technique du système

### 1.5 Définitions et Acronymes

**Termes clés :**
- **API REST** : Architecture pour services web
- **JWT** : Standard d'authentification stateless
- **PostGIS** : Extension géospatiale PostgreSQL
- **Firebase** : Plateforme cloud Google
- **Ionic** : Framework d'applications mobiles hybrides
- **Leaflet** : Bibliothèque pour cartes interactives
- **Docker** : Plateforme de containerisation pour le déploiement
- **Docker Compose** : Outil d'orchestration de conteneurs multi-services
- **RBAC** : Contrôle d'accès basé sur les rôles

**Rôles :** Citoyen (VISITEUR), Manager (gestion complète)

## 2. Contexte & Besoins

### 2.1 Problématique à résoudre

Les infrastructures routières à Madagascar souffrent de manque de visibilité, communication inefficace entre citoyens et municipalité, gestion dispersée des interventions, et traçabilité limitée. Les citoyens ne peuvent pas signaler facilement les problèmes (nids-de-poule, affaissements), les managers ne suivent pas l'avancement des réparations, et il n'y a pas de statistiques fiables.

**Objectif :** Plateforme collaborative pour signalements géolocalisés, gestion des assignations aux entreprises, et analyses statistiques avec traçabilité complète.

### 2.2 Contraintes

- **Techniques :** Multi-plateforme, mode offline, performance cartes, sécurité, évolutivité.
- **Sécurité :** authentification robuste, audit trail, protection contre attaques.
- **Budgétaires :** Technologies open-source , Firebase gratuit.

### 2.3 Exigences Fonctionnelles

- **EF1 :** Gestion utilisateurs (inscription, auth, rôles, blocage/déblocage).
- **EF2 :** Signalements (création GPS, consultation, modification statut, historisation).
- **EF3 :** Cartographie (affichage Leaflet, géolocalisation, filtrage, offline).
- **EF4 :** Assignations (création, suivi statuts, historisation).
- **EF5 :** Synchronisation (bidirectionnelle Firebase↔PostgreSQL, conflits, traçabilité).
- **EF6 :** Statistiques (tableaux/graphiques, performance entreprises, export).


## 3. Architecture générale

### 3.1 Vue d'ensemble du système

Le système de signalement de travaux routiers est une plateforme full-stack composée de trois applications principales interconnectées. L'application mobile permet aux citoyens de signaler les problèmes routiers avec géolocalisation, l'application web offre une interface de gestion pour les managers municipaux et des fonctionnalités de base pour les citoyens avec modes offline et online via Firebase, et l'API backend centralise la logique métier et la persistance des données.

### 3.2 Schéma d'architecture

Le schéma d'architecture montre l'interaction entre les composants: applications mobiles et web communiquant avec Firebase et l'API Spring Boot, qui elle-même interagit avec PostgreSQL/PostGIS pour les données géospatiales.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
├────────────────────────────────┬────────────────────────────────┤
│   Application Mobile           │     Application Web            │
│   (Ionic Vue + Capacitor)      │     (React + TypeScript)       │
│   - iOS / Android              │     - Desktop Browsers         │
│   - Géolocalisation            │     - Gestion avancée          │
│   - Mode Online                │     - Mode Online/Offline      │
│                                │     - Statistiques             │
└────────────────┬───────────────┴──────────────┬─────────────────┘
                 │                              │
                 │         HTTPS / REST API     │
                 │                              │
                 ├───────────────┬──────────────┤
                 │              │               │
        ┌────────▼───────┐      │      ┌────────▼────────┐
        │  Firebase      │      │      │  Spring Boot    │
        │  Services      │      │      │  Backend API    │
        ├────────────────┤      │      ├─────────────────┤
        │ • Auth         │◄─────┼─────►│ • REST API      │
        │ • Firestore    │ Sync │      │ • JWT Security  │
        │ • Storage      │      │      │ • Business Logic│
        └────────────────┘      │      └────────┬────────┘
                                │               │
                                │      ┌────────▼────────┐
                                │      │  PostgreSQL     │
                                │      │  + PostGIS      │
                                │      ├─────────────────┤
                                │      │ • Données       │
                                │      │ • Géospatial    │
                                │      │ • Historisation │
                                │      └─────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │  OpenStreetMap      │
                     │  Tile Server        │
                     │  (Cartes offline)   │
                     └─────────────────────┘
```

### 3.3 Technologies utilisées

Le système utilise les technologies suivantes:

**Backend:**
- **Spring Boot 3.2.1** avec Java 17 pour l'API REST
- **PostgreSQL + PostGIS** pour la base de données géospatiale
- **Firebase Admin SDK** pour la synchronisation

**Frontend Web:**
- **React 19.2.0 + TypeScript** pour les interfaces web (manager et citoyen)
- **Vite** pour le build rapide

**Frontend Mobile:**
- **Ionic 8.0 + Vue.js 3.3** pour l'application hybride
- **Capacitor 8.0** pour l'accès natif

**Services Cloud:**
- **Firebase Authentication & Firestore** pour l'authentification et la synchronisation
- **OpenStreetMap** pour les cartes

**Containerisation:**
- **Docker** pour l'environnement de déploiement

**Outils de Développement:**
- **GitHub** pour le contrôle de version et la collaboration
- **GitHub Desktop** (optionnel) pour une interface graphique
- **Excel** pour le suivi des tâches

### 3.4 Environnements

Le système est déployé dans les environnements suivants:

**Développement:**
- Environnement local avec Docker Compose
- Base de données PostgreSQL 
- Firebase Emulator pour les tests

**Production:**
- Serveur cloud avec Docker containers
- Base de données PostgreSQL/PostGIS
- Firebase Production
- OpenStreetMap tiles server

**Configuration Docker:**


## 4. Description fonctionnelle

La section Description fonctionnelle détaille les aspects opérationnels du système de signalement de travaux routiers. Elle couvre les cas d'utilisation principaux, les parcours utilisateur, et les règles de gestion métier.

### 4.1 Cas d'utilisation

Les cas d'utilisation décrivent les interactions entre les acteurs (citoyens, managers) et le système. Voici les cas d'utilisation principaux :

#### CU1 : Inscription et Connexion Utilisateur
**Acteur principal :** Citoyen ou Manager  
**Préconditions :** Accès à l'application mobile ou web  
**Postconditions :** Utilisateur authentifié et session créée  
**Scénario nominal :**
1. L'utilisateur ouvre l'application
2. Il choisit "S'inscrire" ou "Se connecter"
3. Pour inscription : saisit nom, prénom, email, mot de passe, confirme mot de passe
4. Pour connexion : saisit email et mot de passe
5. Le système vérifie les informations
6. Session créée avec token JWT

**Scénarios alternatifs :**
- Mot de passe oublié : reset via email
- Compte bloqué : message d'erreur après 3 tentatives

#### CU2 : Création d'un Signalement
**Acteur principal :** Citoyen  
**Préconditions :** Utilisateur connecté, géolocalisation activée  
**Postconditions :** Signalement créé dans Firebase et synchronisé  
**Scénario nominal :**
1. L'utilisateur sélectionne "Nouveau signalement" sur la carte
2. Géolocalisation automatique ou manuelle
3. Saisie du type de problème (nid-de-poule, affaissement, etc.)
4. Description et estimation de surface
5. Validation et envoi
6. Confirmation locale immédiate

**Scénarios alternatifs :**
- Mode offline : signalement stocké localement

#### CU3 : Consultation des Signalements
**Acteur principal :** Citoyen ou Manager  
**Préconditions :** Utilisateur connecté  
**Postconditions :** Liste des signalements affichée  
**Scénario nominal :**
1. Accès à la liste des signalements
2. Filtrage par statut et mes signalements (ceux créés par l'utilisateur connecté)
3. Affichage sur carte avec marqueurs
4. Détails d'un signalement sélectionné
5. Historique des états

#### CU4 : Gestion des Statuts de Signalement
**Acteur principal :** Manager  
**Préconditions :** Rôle MANAGER, signalement existant  
**Postconditions :** Statut mis à jour avec historisation  
**Scénario nominal :**
1. Sélection d'un signalement
2. Changement de statut (NOUVEAU → EN_EVALUATION → ASSIGNE)
3. Saisie de commentaires
4. Sauvegarde avec timestamp

#### CU5 : Assignation à une Entreprise
**Acteur principal :** Manager  
**Préconditions :** Signalement en statut ASSIGNE  
**Postconditions :** Assignation créée  
**Scénario nominal :**
1. Sélection du signalement
2. Choix de l'entreprise
3. Définition dates début/fin et montant
4. Création de l'assignation
5. Notification à l'entreprise (future)

#### CU6 : Synchronisation des Données
**Acteur principal :** Manager  
**Préconditions :** Données dans Firebase à synchroniser  
**Postconditions :** Données transférées vers PostgreSQL  
**Scénario nominal :**
1. Accès au panneau de synchronisation
2. Sélection du type (Firebase → PostgreSQL)
3. Lancement de la synchronisation
4. Affichage du progrès et résultats
5. Gestion des conflits (Last-Write-Wins)

#### CU7 : Consultation des Statistiques
**Acteur principal :** Manager  
**Préconditions :** Rôle MANAGER  
**Postconditions :** Graphiques et rapports affichés  
**Scénario nominal :**
1. Accès au tableau de bord
2. Sélection de la période
3. Affichage des KPIs (signalements par mois, taux de résolution)
4. Export possible en PDF/Excel

#### CU8 : Déblocage d'un Utilisateur
**Acteur principal :** Manager  
**Préconditions :** Compte utilisateur bloqué  
**Postconditions :** Compte débloqué  
**Scénario nominal :**
1. Accès à la gestion des utilisateurs
2. Recherche de l'utilisateur bloqué
3. Sélection "Débloquer"
4. Confirmation de l'action

### 4.2 Parcours utilisateur

Les parcours utilisateur décrivent les expériences complètes des acteurs principaux dans des scénarios typiques.

#### Parcours Citoyen : Signalement d'un Problème Routier

**Contexte :** Un citoyen remarque un nid-de-poule sur sa route quotidienne.

**Étapes :**
1. **Découverte :** Téléchargement de l'application mobile 
2. **Inscription :** Création de compte avec nom, prénom, email et mot de passe
3. **Connexion :** Authentification via Firebase
4. **Navigation :** Ouverture de la carte centrée sur la position actuelle
5. **Création :** Accès au formulaire de signalement, utilisation du bouton 'Localiser' pour afficher la carte, appui sur la carte à l'emplacement du problème ou utilisation du bouton 'Ma position'
6. **Saisie :** Sélection du type "nid de poule", description "Dangereux pour les motos"
7. **Validation :** Envoi du signalement
8. **Confirmation :** Message de succès et marqueur apparu sur la carte
9. **Suivi :** Consultation du statut dans "Mes signalements"
10. **Notification :** (Future) alerte quand statut change

**Points de douleur potentiels :**
- Géolocalisation imprécise en zone urbaine dense
- Connexion internet faible lors de l'envoi

#### Parcours Manager : Gestion Quotidienne

**Contexte :** Un manager municipal gère les signalements entrants.

**Étapes :**
1. **Connexion :** Accès à l'application web avec email/mot de passe
2. **Vue d'ensemble :** Dashboard avec statistiques 
3. **Tri :** Filtrage des signalements par priorité et zone
4. **Évaluation :** Ouverture d'un signalement, vérification photos/localisation
5. **Assignation :** Attribution à une entreprise avec dates et budget
6. **Suivi :** Mise à jour des statuts selon avancement
7. **Synchronisation :** Transfert des données Firebase vers base centrale
8. **Reporting :** Génération de rapports hebdomadaires
9. **Administration :** Déblocage de comptes utilisateurs si nécessaire

**Points de douleur potentiels :**
- Surcharge de signalements pendant saison des pluies
- Coordination avec entreprises externes

#### Parcours Citoyen : Consultation Web

**Contexte :** Un citoyen veut voir l'état des travaux dans sa ville.

**Étapes :**
1. **Accès :** Navigation vers le site web 
2. **Authentification :** Connexion avec compte existant
3. **Exploration :** Carte interactive avec tous les signalements publics
4. **Filtrage :** statut, type de travaux
5. **Détails :** Clic sur un marqueur pour voir progression
6. **Participation :** Possibilité de commenter ou signaler des erreurs

### 4.3 Règles de gestion

Les règles de gestion définissent les contraintes métier et les validations du système.

#### RG1 : Authentification et Autorisation
- Tout accès aux données nécessite une authentification valide
- Les tokens JWT expirent après 24 heures
- Les comptes sont bloqués après 3 tentatives de connexion échouées
- Seuls les managers peuvent modifier les statuts des signalements
- Seuls les managers peuvent assigner des entreprises
- Seuls les managers peuvent consulter les statistiques globales

#### RG2 : Gestion des Signalements
- Un signalement doit obligatoirement avoir une localisation GPS
- Le type de travaux est obligatoire parmi la liste prédéfinie
- La description ne peut excéder 500 caractères
- Les changements de statut sont historisés avec date et utilisateur
- Un signalement doit passer par tous les statuts dans l'ordre

#### RG3 : Assignations
- Une assignation nécessite une entreprise valide
- Les dates début/fin doivent être cohérentes (fin > début)
- Le montant est estimé en Ariary
- Le statut d'assignation suit : EN_ATTENTE → ACCEPTE → EN_COURS → TERMINE

#### RG4 : Synchronisation
- La synchronisation Firebase → PostgreSQL est déclenchée manuellement par manager
- En cas de conflit, la dernière écriture l'emporte (Last-Write-Wins)
- Toutes les opérations de sync sont tracées dans la table synchronisation_firebase
- La synchronisation PostgreSQL → Firebase transfère toutes les données

#### RG5 : Données Géospatiales
- Les coordonnées sont stockées en WGS84 (latitude/longitude)

#### RG6 : Sécurité des Données
- Les mots de passe sont hashés avec BCrypt (future)
- Les communications utilisent HTTPS/TLS
- L'audit trail conserve l'historique

## 5. Modélisation des Données

### 5.1 Modèle Conceptuel de Données (MCD)

Diagramme Entité-Association avec cardinalités (MCD):

[Screenshot: Modèle Conceptuel de Données avec associations et cardinalités]

### 5.2 Tables Principales

#### 5.2.1 Table utilisateur
Rôle: Stocke utilisateurs (citoyens, managers, entreprises)
Champs clés: firebase_uid (lien Firebase), is_blocked (blocage auto), last_update (sync)
Contraintes: Email unique, firebase_uid unique si présent, type utilisateur obligatoire

#### 5.2.2 Table signalement
Rôle: Cœur du système - signalements géolocalisés
Champs géospatiaux: latitude/longitude (WGS84, précision 10 décimales), geom (PostGIS)
Particularités: surface_metre_carree (priorisation), pas de statut direct (via historique)

#### 5.2.3 Table historique_etat_signalement
Rôle: Audit trail des changements d'état
Avantages: Traçabilité complète, métriques performance, auditabilité
Requête état actuel:

#### 5.2.4 Table entreprise_concerner (Assignations)
Rôle: Liens signalements-entreprises
Workflow: Création par manager → mise à jour par entreprise → historisation
Particularités: Plusieurs assignations possibles par signalement

#### 5.2.5 Table session
Rôle: Gestion sessions JWT
Utilisation: Validation tokens, révocation, nettoyage auto

#### 5.2.6 Table tentative_connexion
Rôle: Audit sécurité et limitation tentatives
Analyses: Détection intrusions, stats échecs

### 5.3 Tables de Référence
type_utilisateur: Visiteur, Manager
etat_signalement: En attente, En cours, Résolu, Rejeté
type_travail: Réparation de chaussée, Construction de route, Signalisation, Éclairage public, Maintenance
statut_assignation: En attente, Accepté, Refusé, En cours, Terminé
Avantages normalisation: Intégrité référentielle, facilité modifications, performances

### 5.4 Table de Synchronisation
synchronisation_firebase
Traçabilité: Timestamp, statut, remarques (erreurs, nb enregistrements)

## 6. Sécurité et Authentification

### 6.1 Authentification / autorisation

Le système implémente une authentification hybride adaptée aux différents clients et modes de fonctionnement :

- **Application mobile** : Authentification directe via Firebase Authentication
- **Application web** : Double possibilité selon le mode - Firebase Auth pour le mode online ou JWT via API REST pour le mode offline 

**Flux d'authentification mobile :**
```
Mobile App → Firebase Auth → ID Token → Firestore Access → Synchronisation
```

**Flux d'authentification web (option 1 - Firebase) :**
```
Web App → Firebase Auth → ID Token → Backend API → Validation → Accès autorisé
```

**Flux d'authentification web (option 2 - JWT) :**
```
Web App → API Login → JWT Token → Backend API → Validation JWT → Accès autorisé
```

**Gestion des sessions :** Les sessions utilisateur sont stockées en base de données avec un token unique, une date d'expiration et une référence à l'utilisateur. Un mécanisme de nettoyage automatique supprime les sessions expirées pour optimiser les performances. Les sessions permettent la révocation d'accès et le suivi des connexions actives.

**Protection des endpoints :** Chaque endpoint de l'API REST est protégé par des annotations de sécurité Spring qui vérifient les rôles de l'utilisateur avant d'autoriser l'accès. Les contrôleurs utilisent des annotations @PreAuthorize pour définir les permissions requises selon les fonctionnalités métier.
```java
@PreAuthorize("hasRole('VISITEUR') or hasRole('MANAGER')")
public ResponseEntity<List<SignalementDTO>> getSignalements() { ... }
```

**Limitation des tentatives :** Blocage automatique après 3 échecs consécutifs, avec traçabilité des connexions dans la table `tentative_connexion`. Cette mesure protège contre les attaques par force brute tout en permettant aux managers de consulter les logs et de débloquer manuellement les comptes légitimes.

### 6.2 Gestion des rôles et droits

**Modèle RBAC :**
- **VISITEUR** : Créer/consulter ses signalements
- **MANAGER** : Gestion complète + statistiques

**Matrice des permissions :**

| Fonctionnalité | VISITEUR | MANAGER |
|----------------|----------|---------|
| Créer signalement | Oui | Oui |
| Voir signalements | Oui  | Oui (tous) |
| Modifier statut | non | Oui |
| Assigner entreprise | Non | Oui |
| Statistiques | Non | Oui |

### 6.4 Logs et traçabilité

Le système maintient une traçabilité complète de toutes les opérations critiques à travers plusieurs tables dédiées :

**Table synchronisation_firebase :** Enregistre toutes les opérations de synchronisation bidirectionnelle entre Firebase et PostgreSQL, incluant la date, le statut de succès et les remarques sur les erreurs ou le nombre d'enregistrements traités.

**Table historique_etat_signalement :** Conserve l'historique complet des changements d'état des signalements (NOUVEAU → EN_EVALUATION → ASSIGNE, etc.), permettant de suivre l'évolution temporelle de chaque signalement et d'identifier les goulots d'étranglement dans le processus.

**Table historique_statut_assignation :** Trace tous les changements de statut des assignations d'entreprises (ASSIGNE → EN_COURS → TERMINE), facilitant le suivi des performances des entreprises et la génération de rapports d'activité.

**Table tentative_connexion :** Enregistre chaque tentative de connexion avec son résultat (succès/échec), permettant la détection d'attaques par force brute et l'analyse des patterns de connexion suspects.

**Table session :** Gère les sessions utilisateur actives avec leurs dates de début et de fin, permettant la révocation d'accès et le nettoyage automatique des sessions expirées.

Ces mécanismes de traçabilité assurent l'auditabilité complète du système, facilitent le débogage et respectent les exigences de conformité en matière de sécurité et de transparence.

## 7. Installation et Déploiement

Le système est conçu pour un déploiement simplifié grâce à la containerisation Docker. L'ensemble de l'infrastructure (backend, base de données, frontend web et serveur de cartes) peut être déployé en une seule commande.

### 7.1 Prérequis système

- **Docker** (version 20.10 ou supérieure)
- **Docker Compose** (version 2.0 ou supérieure)
- **4GB RAM minimum** (recommandé 8GB)
- **10GB espace disque** pour les conteneurs et données

### 7.2 Déploiement avec Docker Compose

1. **Cloner le repository :**
   ```bash
   git clone https://github.com/Nathanlovaniaina/Projet_Cloud_S5.git
   cd projet-cloud-s5
   ```

2. **Configurer Firebase :**
   Avant de lancer les services, configurez les clés API Firebase et le compte de service Firebase en suivant le guide dédié (voir annexe 9.1).

3. **Lancer les services :**
   ```bash
   docker-compose up -d
   ```

4. **Vérifier le déploiement :**
   ```bash
   docker-compose ps
   ```

Cette commande démarre automatiquement :
- **Base de données PostgreSQL + PostGIS** (port 5432)
- **API Backend Spring Boot** (port 8080)
- **Application Web React** (port 3000)
- **Serveur de cartes OpenStreetMap** (port 8081)

### 7.3 Accès aux applications

- **Application Web Manager :** http://localhost:3000
- **API Backend :** http://localhost:8080
- **Base de données :** localhost:5432 (signalement_db)
- **Cartes :** http://localhost:8081

### 7.4 Application Mobile

L'application mobile n'est pas incluse dans le déploiement Docker car elle nécessite une installation native sur les appareils.

**Installation :**
- Téléchargez l'APK depuis le lien Google Drive fourni (voir annexe 9.1)
- Installez l'application sur votre appareil
- L'application se connecte automatiquement à Firebase

**Note :** Assurez-vous que l'application mobile peut accéder à Firebase (connexion internet requise).

### 7.5 Configuration Firebase

Avant le premier lancement, configurez les clés Firebase dans les fichiers de configuration appropriés pour activer la synchronisation et l'authentification.

### 7.6 Dépannage

- **Ports occupés :** Modifiez les ports dans docker-compose.yml si nécessaire
- **Mémoire insuffisante :** Augmentez la RAM allouée à Docker
- **Problèmes de réseau :** Vérifiez que tous les conteneurs sont sur le même réseau Docker

## 8. Conclusion et Améliorations

### 8.1 Bilan du Projet

Le système de signalement de travaux routiers représente une solution complète et moderne pour la gestion collaborative des infrastructures routières à Madagascar. L'architecture full-stack développée démontre une maîtrise technique solide des technologies contemporaines, avec une intégration réussie de services cloud (Firebase), de bases de données géospatiales (PostGIS), et d'interfaces multi-plateformes (mobile/web).

Les choix technologiques open-source et la containerisation Docker assurent une évolutivité et une maintenabilité optimales. Le système répond efficacement aux problématiques identifiées : signalements citoyens géolocalisés, gestion municipale centralisée, et traçabilité complète des interventions.

### 8.2 Fonctionnalités Réalisées

- Authentification hybride (Firebase + JWT)
- Signalements géolocalisés avec cartes interactives
- Gestion des rôles et permissions (RBAC)
- Synchronisation bidirectionnelle Firebase ↔ PostgreSQL
- Historisation complète des opérations
- Interface web de gestion pour managers
- Application mobile pour citoyens
- Statistiques et tableaux de bord
- Sécurité avancée
- Déploiement containerisé simplifié

### 8.3 Améliorations Futures

#### Améliorations Fonctionnelles
- **Notifications push :** Alertes en temps réel pour les citoyens sur l'évolution de leurs signalements
- **Intégration GPS avancée :** Calculs d'itinéraires alternatifs et optimisation des interventions
- **Système de notation :** Évaluation des entreprises par les citoyens
- **API publique :** Exposition d'APIs pour intégrations tierces

#### Améliorations Techniques
- **Cache distribué :** Redis pour améliorer les performances des requêtes fréquentes
- **Monitoring avancé :** Intégration Prometheus/Grafana pour métriques système
- **Tests automatisés :** Couverture complète avec CI/CD pipeline
- **Performance mobile :** Optimisation PWA et mode offline

#### Évolutivité
- **Internationalisation :** Support multi-langues pour déploiement dans d'autres régions
- **API Gateway :** Gestion centralisée des APIs avec rate limiting et caching

### 8.4 Impact et Valeur Ajoutée

Ce système apporte une valeur significative à la gestion des infrastructures routières malgaches en :
- **Améliorant la transparence** : Traçabilité complète des interventions
- **Optimisant les ressources** : Priorisation intelligente des travaux
- **Renforçant la participation citoyenne** : Implication active de la population
- **Réduisant les coûts** : Maintenance préventive et planification efficace
- **Modernisant l'administration** : Digitalisation des processus municipaux

Le projet démontre comment les technologies cloud et mobiles peuvent transformer les services publics, créant un écosystème collaboratif entre citoyens et administration.

## 9. Annexes

### 9.1 Liens et Ressources

**Repository GitHub :**
- URL : https://github.com/Nathanlovaniaina/Projet_Cloud_S5.git
- Contient : Code source complet, documentation, scripts de déploiement

**Application Mobile (APK) :**
- Lien Google Drive : https://drive.google.com/file/d/1EXAMPLE_LINK/view?usp=sharing
- Version : 1.0.0
- Plateformes : Android 

**Document de Configuration Firebase :**
- Lien Google Drive : https://drive.google.com/file/d/1FIREBASE_CONFIG_LINK/view?usp=sharing
- Contient : Guide de configuration des clés API Firebase et du compte de service Firebase

### 9.2 Technologies et Versions

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend API | Spring Boot | 3.2.1 |
| Base de données | PostgreSQL + PostGIS | 13.3 |
| Frontend Web | React + TypeScript | 19.2.0 |
| Frontend Mobile | Ionic + Vue.js | 8.0 / 3.3 |
| Authentification | Firebase | Latest |
| Containerisation | Docker | 20.10+ |
| Orchestration | Docker Compose | 2.0+ |

### 9.6 Contacts et Support

**Équipe de Développement :**
- ETU003241 : Base de Données & Géospatial
- ETU003346 : Frontend Web & UI/UX
- ETU003337 : Lead Backend & Architecture
- ETU003358 : Mobile & Intégration

**Support Technique :**
- Email : laurentrandri@gmail.com
- Documentation : [Lien vers la doc utilisateur]

