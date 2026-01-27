-- Fichier de données de test réalistes pour le système de signalement
-- Ce fichier doit être exécuté après le script.sql

BEGIN;

-- Insertion des types d'utilisateurs
INSERT INTO type_utilisateur (libelle, last_update) VALUES 
('Visiteur', NOW()),
('Manager', NOW())
ON CONFLICT (libelle) DO NOTHING;

-- Insertion des états de signalement
INSERT INTO etat_signalement (libelle, last_update) VALUES 
('En attente', NOW()),
('En cours', NOW()),
('Résolu', NOW()),
('Rejeté', NOW())
ON CONFLICT (libelle) DO NOTHING;

-- Insertion des types de travail
INSERT INTO type_travail (libelle, last_update) VALUES 
('Réparation de chaussée', NOW()),
('Construction de route', NOW()),
('Signalisation', NOW()),
('Éclairage public', NOW()),
('Maintenance', NOW())
ON CONFLICT (libelle) DO NOTHING;

-- Insertion des statuts d'assignation
INSERT INTO statut_assignation (libelle, last_update) VALUES 
('En attente', NOW()),
('Accepté', NOW()),
('Refusé', NOW()),
('En cours', NOW()),
('Terminé', NOW())
ON CONFLICT (libelle) DO NOTHING;

-- ==========================================
-- UTILISATEURS DE TEST
-- ==========================================

-- Managers
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Rakoto', 'Jean', 'admin@gmail.com', 'manager123', 'PCBxOaX1AsWCgexzdrkidttkN463', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteurs (utilisateurs normaux)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', 'qZo7wYrxotPPEIRbA9BLcMIQOZk1', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));

-- ==========================================
-- ENTREPRISES
-- ==========================================

INSERT INTO entreprise (nom_du_compagnie, email, last_update)
VALUES 
    ('TP SAHONDRA', 'contact@tpsahondra.mg', NOW()),
    ('COLAS Madagascar', 'info@colasmada.com', NOW()),
    ('SOGEA SATOM', 'contact@sogeasatom.mg', NOW());
    
COMMIT;
