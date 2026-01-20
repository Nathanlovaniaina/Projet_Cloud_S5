-- Fichier de données de test réalistes pour le système de signalement
-- Ce fichier doit être exécuté après le script.sql

BEGIN;

-- Insertion des types d'utilisateurs (si pas déjà présents)
INSERT INTO type_utilisateur (libelle) VALUES ('Visiteur') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO type_utilisateur (libelle) VALUES ('Manager') ON CONFLICT (libelle) DO NOTHING;

-- Insertion des états de signalement (si pas déjà présents)
INSERT INTO etat_signalement (libelle) VALUES ('En attente') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO etat_signalement (libelle) VALUES ('En cours') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO etat_signalement (libelle) VALUES ('Terminé') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO etat_signalement (libelle) VALUES ('Annulé') ON CONFLICT (libelle) DO NOTHING;

-- Insertion des types de travail (si pas déjà présents)
INSERT INTO type_travail (libelle) VALUES ('Réparation de chaussée') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO type_travail (libelle) VALUES ('Construction de route') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO type_travail (libelle) VALUES ('Signalisation') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO type_travail (libelle) VALUES ('Éclairage public') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO type_travail (libelle) VALUES ('Maintenance') ON CONFLICT (libelle) DO NOTHING;

-- Insertion des statuts d'assignation (si pas déjà présents)
INSERT INTO statut_assignation (libelle) VALUES ('En attente') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO statut_assignation (libelle) VALUES ('Accepté') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO statut_assignation (libelle) VALUES ('Refusé') ON CONFLICT (libelle) DO NOTHING;
INSERT INTO statut_assignation (libelle) VALUES ('En cours') ON CONFLICT (libelle) DO NOTHING;

-- ==========================================
-- UTILISATEURS DE TEST
-- ==========================================

-- Managers
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, is_blocked, synced, Id_type_utilisateur)
VALUES 
    ('Rakoto', 'Jean', 'jean.rakoto@signalement.mg', 'manager123', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    
    ('Ravelo', 'Marie', 'marie.ravelo@signalement.mg', 'manager456', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    
    ('Rasolofo', 'Patrick', 'patrick.rasolofo@signalement.mg', 'manager789', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteurs (utilisateurs normaux)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, is_blocked, synced, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Razafindrakoto', 'Nadia', 'nadia.razaf@gmail.com', 'visiteur456', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Randrianaivo', 'Haja', 'haja.rand@gmail.com', 'visiteur789', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Raharison', 'Volatiana', 'vola.rahari@yahoo.fr', 'password123', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Rakotomavo', 'Mialy', 'mialy.rakoto@outlook.com', 'password456', false, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));

-- Utilisateur bloqué (pour tester le déblocage)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, is_blocked, synced, Id_type_utilisateur)
VALUES 
    ('Ramanana', 'Koto', 'koto.bloque@gmail.com', 'bloque123', true, false, 
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));

-- ==========================================
-- ENTREPRISES
-- ==========================================

INSERT INTO entreprise (nom_du_compagnie, email)
VALUES 
    ('Entreprise Travaux Publics Madagascar', 'contact@etpmada.mg'),
    ('Route Construction SA', 'info@routeconst.mg'),
    ('BTP Solutions Tana', 'contact@btpsolutions.mg'),
    ('Infraroute Madagascar', 'contact@infraroute.mg'),
    ('Madagascar Bitume & Routes', 'contact@madaroutes.mg');

COMMIT;

