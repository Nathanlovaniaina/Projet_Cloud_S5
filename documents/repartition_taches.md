# Répartition des Tâches - Projet Signalement Travaux Routiers

## Scénario 1: Infrastructure et Setup Initial

## Tâche 1
**Catégorie** : Infrastructure  
**Module** : Setup  
**Tâches** : Configuration initiale du repository Git (GitHub public)  
**Type** : Configuration  
**Qui** : ETU003241  
**Estimation** : 30   

## Tâche 2
**Catégorie** : Infrastructure  
**Module** : Setup  
**Tâches** : Mise en place de la structure Docker pour le projet  
**Type** : Configuration  
**Qui** : ETU003241  
**Estimation** : 60   

## Scénario 2: Infrastructure - Base de Données

## Tâche 3
**Catégorie** : Infrastructure  
**Module** : Base de données  
**Tâches** : Configuration du conteneur Docker PostgreSQL  
**Type** : Configuration  
**Qui** : ETU003346  
**Estimation** : 45   

## Tâche 4
**Catégorie** : Infrastructure  
**Module** : Base de données  
**Tâches** : Création du MCD (Modèle Conceptuel de Données)  
**Type** : Conception  
**Qui** : ETU003346  
**Estimation** : 120   

## Tâche 5
**Catégorie** : Infrastructure  
**Module** : Base de données  
**Tâches** : Création des tables pour les utilisateurs  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 6
**Catégorie** : Infrastructure  
**Module** : Base de données  
**Tâches** : Création des tables pour les signalements  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 7
**Catégorie** : Infrastructure  
**Module** : Base de données  
**Tâches** : Création des tables pour le suivi des tentatives de connexion  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 60   

## Scénario 3: Backend - Authentification

## Tâche 8
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Setup du projet Java Spring Boot  
**Type** : Configuration  
**Qui** : ETU003337  
**Estimation** : 60   

## Tâche 9
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Configuration de Firebase pour l'authentification en ligne  
**Type** : Configuration  
**Qui** : ETU003337  
**Estimation** : 90   

## Tâche 10
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Implémentation de la connexion à PostgreSQL local  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 120   

## Tâche 11
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Développement de l'API REST - Inscription (email/pwd)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 150   

## Tâche 12
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Développement de l'API REST - Authentification (email/pwd)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 150   

## Tâche 13
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Implémentation de la gestion des sessions avec durée de vie  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 180   

## Tâche 14
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Développement de l'API REST - Modification des infos utilisateurs  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 120   

## Tâche 15
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Implémentation du système de limite de tentatives de connexion (3 par défaut)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 150   

## Tâche 16
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Développement de l'API REST - Déblocage d'utilisateur  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 90   

## Tâche 17
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Configuration de Swagger pour la documentation API  
**Type** : Configuration  
**Qui** : ETU003346  
**Estimation** : 60   

## Tâche 18
**Catégorie** : Backend  
**Module** : Authentification  
**Tâches** : Rédaction de la documentation Swagger pour toutes les routes  
**Type** : Documentation  
**Qui** : ETU003346  
**Estimation** : 120   

## Scénario 4: Backend - Signalements et Synchronisation

## Tâche 19
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Créer un signalement  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 120   

## Tâche 20
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Récupérer tous les signalements  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 21
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Récupérer mes signalements  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 22
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Modifier un signalement (infos manager)  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 120   

## Tâche 23
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Modifier le statut d'un signalement  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 90   

## Tâche 24
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Standardisation des retours API REST (ApiResponse uniformes)  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 60   

## Tâche 25
**Catégorie** : Infrastructure  
**Module** : Base de données  
**Tâches** : Modification de la structure de la base de données (Looping, script.sql et data-reel.sql)  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 120   

## Tâche 26
**Catégorie** : Backend  
**Module** : Entités  
**Tâches** : Mise à jour des entités Java et correction des problèmes liés au changement de schéma  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 180   

## Tâche 27
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Assigner un signalement à une entreprise (manager)  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 120   

## Tâche 28
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Modifier le statut d'une assignation entreprise (manager)  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 90   

## Tâche 29
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Implémentation des règles métier - Liaison état signalement et assignations entreprises  
**Type** : Développement  
**Qui** : ETU003358 
**Estimation** : 120   

## Tâche 30
**Catégorie** : Backend  
**Module** : Signalements  
**Tâches** : Création de l'API REST - Récupérer les assignations d'un signalement  
**Type** : Développement  
**Qui** : ETU003358
**Estimation** : 90   

## Tâche 31
**Catégorie** : Backend  
**Module** : Synchronisation  
**Tâches** : Développement de l'API - Synchronisation avec Firebase (récupération)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 180   

## Tâche 32
**Catégorie** : Backend  
**Module** : Synchronisation  
**Tâches** : Développement de l'API - Synchronisation avec Firebase (envoi)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 180   

## Tâche 33
**Catégorie** : Backend  
**Module** : Statistiques  
**Tâches** : Création de l'API REST - Récapitulatif 
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 150   

## Scénario 5: Infrastructure - Cartes

## Tâche 34
**Catégorie** : Infrastructure  
**Module** : Cartes  
**Tâches** : Installation du serveur de cartes Offline sur Docker  
**Type** : Configuration  
**Qui** : ETU003346  
**Estimation** : 90   

## Tâche 35
**Catégorie** : Infrastructure  
**Module** : Cartes  
**Tâches** : Téléchargement des données cartographiques d'Antananarivo  
**Type** : Configuration  
**Qui** : ETU003346  
**Estimation** : 45   

## Tâche 36
**Catégorie** : Infrastructure  
**Module** : Cartes  
**Tâches** : Configuration du serveur de tiles pour OpenStreetMap  
**Type** : Configuration  
**Qui** : ETU003346  
**Estimation** : 90   

## Scénario 6: Frontend Web

## Tâche 37
**Catégorie** : Frontend Web  
**Module** : Setup  
**Tâches** : Initialisation du projet React  
**Type** : Configuration  
**Qui** : ETU003337  
**Estimation** : 45   

## Tâche 38
**Catégorie** : Frontend Web  
**Module** : Setup  
**Tâches** : Installation et configuration de Leaflet pour React  
**Type** : Configuration  
**Qui** : ETU003337  
**Estimation** : 60   

## Tâche 39
**Catégorie** : Frontend Web  
**Module** : Authentification  
**Tâches** : Création d'un service de gestion de connectivité et basculement d'authentification (Firebase/PostgreSQL)  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 120   

## Tâche 40
**Catégorie** : Frontend Web  
**Module** : Authentification  
**Tâches** : Création du composant de connexion avec détection de connectivité Internet et basculement dynamique Firebase/PostgreSQL  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 180   

## Tâche 41
**Catégorie** : Frontend Web  
**Module** : Authentification  
**Tâches** : Création du composant d'inscription avec basculement Firebase/PostgreSQL selon la connectivité  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 150   

## Tâche 42
**Catégorie** : Frontend Web  
**Module** : Authentification  
**Tâches** : Implémentation de la gestion des sessions côté client (support Firebase et PostgreSQL)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 120   

## Tâche 43
**Catégorie** : Frontend Web  
**Module** : Authentification  
**Tâches** : Création du composant de modification de profil utilisateur avec synchronisation multicanal (Firebase/PostgreSQL)  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 120   

## Tâche 44
**Catégorie** : Frontend Web  
**Module** : Carte  
**Tâches** : Intégration de Leaflet - Affichage de la carte Antananarivo  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 150   

## Tâche 45
**Catégorie** : Frontend Web  
**Module** : Carte  
**Tâches** : Affichage des marqueurs de signalements sur la carte  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 120   

## Tâche 46
**Catégorie** : Frontend Web  
**Module** : Carte  
**Tâches** : Implémentation du survol de marqueurs
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 47
**Catégorie** : Frontend Web  
**Module** : Visiteur  
**Tâches** : Création de la page visiteur avec carte et récapitulatif  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 150   

## Tâche 48
**Catégorie** : Frontend Web  
**Module** : Visiteur  
**Tâches** : Affichage du tableau de récapitulation 
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 120   

## Tâche 49
**Catégorie** : Frontend Web  
**Module** : Manager  
**Tâches** : Création de la page de gestion des signalements  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 180   

## Tâche 50
**Catégorie** : Frontend Web  
**Module** : Manager  
**Tâches** : Implémentation du bouton de synchronisation Firebase  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 120   

## Tâche 51
**Catégorie** : Frontend Web  
**Module** : Manager  
**Tâches** : Création de la page de déblocage des utilisateurs  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 90   

## Tâche 52
**Catégorie** : Frontend Web  
**Module** : Manager  
**Tâches** : Formulaire d'édition des infos de signalement 
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 150   

## Tâche 53
**Catégorie** : Frontend Web  
**Module** : Manager  
**Tâches** : Implémentation de la modification du statut des signalements  
**Type** : Développement  
**Qui** : ETU003337  
**Estimation** : 90   

## Tâche 54
**Catégorie** : Frontend Web  
**Module** : Design  
**Tâches** : Design responsive de l'application web  
**Type** : Design  
**Qui** : ETU003337  
**Estimation** : 180   

## Tâche 55
**Catégorie** : Frontend Web  
**Module** : Design  
**Tâches** : Création du système de navigation et routing  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 90   

## Scénario 7: Frontend Mobile

## Tâche 56
**Catégorie** : Frontend Mobile  
**Module** : Setup  
**Tâches** : Initialisation du projet Ionic avec Vue.js  
**Type** : Configuration  
**Qui** : ETU003358  
**Estimation** : 60   

## Tâche 57
**Catégorie** : Frontend Mobile  
**Module** : Setup  
**Tâches** : Configuration de Firebase SDK pour mobile  
**Type** : Configuration  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 58
**Catégorie** : Frontend Mobile  
**Module** : Setup  
**Tâches** : Installation et configuration de Leaflet pour Vue.js  
**Type** : Configuration  
**Qui** : ETU003337  
**Estimation** : 60   

## Tâche 59
**Catégorie** : Frontend Mobile  
**Module** : Authentification  
**Tâches** : Écran de connexion Firebase  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 120   

## Tâche 60
**Catégorie** : Frontend Mobile  
**Module** : Carte  
**Tâches** : Intégration de Leaflet avec OpenStreetMap en ligne  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 150   

## Tâche 61
**Catégorie** : Frontend Mobile  
**Module** : Signalement  
**Tâches** : Implémentation de la géolocalisation  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 120   

## Tâche 62
**Catégorie** : Frontend Mobile  
**Module** : Signalement  
**Tâches** : Interface de création de signalement sur la carte  
**Type** : Développement  
**Qui** : ETU003241  
**Estimation** : 150   

## Tâche 63
**Catégorie** : Frontend Mobile  
**Module** : Carte  
**Tâches** : Affichage de la carte avec tous les signalements  
**Type** : Développement  
**Qui** : ETU003346  
**Estimation** : 120   

## Tâche 64
**Catégorie** : Frontend Mobile  
**Module** : Filtre  
**Tâches** : Implémentation du filtre "Mes signalements uniquement"  
**Type** : Développement  
**Qui** : ETU003358  
**Estimation** : 90   

## Tâche 65
**Catégorie** : Frontend Mobile  
**Module** : Build  
**Tâches** : Configuration pour la génération de l'APK Android  
**Type** : Configuration  
**Qui** : ETU003337  
**Estimation** : 60   

## Tâche 66
**Catégorie** : Frontend Mobile  
**Module** : Build  
**Tâches** : Génération et test de l'APK final  
**Type** : Build  
**Qui** : ETU003337  
**Estimation** : 90   

## Scénario 8: Documentation et Gestion

## Tâche 67
**Catégorie** : Documentation  
**Module** : Technique  
**Tâches** : Rédaction de la documentation technique  
**Type** : Documentation  
**Qui** : ETU003346  
**Estimation** : 180   

## Tâche 68
**Catégorie** : Gestion  
**Module** : Suivi  
**Tâches** : Mise en place du système de suivi des tâches  
**Type** : Gestion  
**Qui** : ETU003358  
**Estimation** : 45   
