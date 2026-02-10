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

-- Manager
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Rakoto', 'Jean', 'jean.rakoto@signalement.mg', 'manager123', 'qZo7wYrxotPPEIRbA9BLcMIQOZk1', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteur
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', 'YHNsPqAcw7fUE8Reb7HOFMHYoQm2', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));

-- ==========================================
-- PRIX PAR MÈTRE CARRÉ
-- ==========================================

INSERT INTO prix_m_carree (valeur, date_changement, last_update)
VALUES 
    (1000000.00, '2024-12-01', NOW()),
    (1200000.00, '2025-01-01', NOW()),
    (1300000.00, '2025-02-01', NOW());

-- ==========================================
-- ENTREPRISES
-- ==========================================

INSERT INTO entreprise (nom_du_compagnie, email, last_update)
VALUES 
    ('TP SAHONDRA', 'contact@tpsahondra.mg', NOW()),
    ('COLAS Madagascar', 'info@colasmada.mg', NOW()),
    ('SOGEA SATOM', 'contact@sogeasatom.mg', NOW()),
    ('RAZEL BEC Madagascar', 'devis@razelbec.mg', NOW()),
    ('ENTERPRISE RAKOTOVAO', 'entreprise.rakotovao@gmail.com', NOW()),
    ('STOI Madagascar', 'commercial@stoi.mg', NOW()),
    ('SECREN SARL', 'contact@secren.mg', NOW()),
    ('BOUYGUES TP Madagascar', 'contact@bouygues-tp.mg', NOW()),
    ('TSARAFARA BTP', 'info@tsarafara-btp.mg', NOW()),
    ('MADAPLUS Construction', 'devis@madaplus.mg', NOW()),
    ('RAMANANTSOA TP', 'ramanantsoa.tp@moov.mg', NOW()),
    ('HASYMA Travaux Publics', 'hasyma.tp@orange.mg', NOW()),
    ('SOCOFIMA', 'socofima@blueline.mg', NOW()),
    ('ANDRIANIRINA BTP', 'andrianirina.btp@gmail.com', NOW());
    
COMMIT;


BEGIN;

-- ==========================================
-- SIGNALEMENTS RÉALISTES
-- ==========================================
-- Signalements avec niveau et budget (assignables)
-- Budget calculé avec: prix_m2 * niveau * surface_m2

INSERT INTO signalement (latitude, longitude, titre, description, surface_metre_carree, date_creation, geom, last_update, niveau, budget, Id_type_travail, Id_utilisateur)
VALUES
-- Signalement 1: Prix 1,300,000 * Niveau 8 * 12.50 = 130,000,000
(-18.8765, 47.5120, 'Nids de poule Route Digue', 'Plusieurs nids de poule de 30-50cm de diamètre causent des dommages aux véhicules. Zone très fréquentée par les taxis et bus. Risque d''accidents notamment pour les deux-roues. Intervention urgente requise.', 12.50, '2025-02-01 08:30:00', ST_SetSRID(ST_MakePoint(47.5120, -18.8765), 4326)::geography, NOW(), 8, 130000000.00, 1, 2),

-- Signalement 2: Prix 1,200,000 * Niveau 9 * 15.20 = 164,160,000
(-18.8790, 47.5095, 'Affaissement de chaussée Avenue Indépendance', 'Affaissement progressif de la chaussée sur environ 15 mètres carrés. Présence de fissures en toile d''araignée. La circulation est ralentie et dangereuse, particulièrement pour les poids lourds.', 15.20, '2025-01-30 14:15:00', ST_SetSRID(ST_MakePoint(47.5095, -18.8790), 4326)::geography, NOW(), 9, 164160000.00, 1, 2),

-- Signalement 3: Prix 1,200,000 * Niveau 5 * 8.00 = 48,000,000
(-18.8810, 47.5140, 'Caniveau bouché quartier Analakely', 'Le caniveau est complètement obstrué par des déchets et de la boue. En période de pluie, l''eau stagne et inonde la chaussée. Risque sanitaire et de dégradation accélérée de la route.', 8.00, '2025-01-28 10:45:00', ST_SetSRID(ST_MakePoint(47.5140, -18.8810), 4326)::geography, NOW(), 5, 48000000.00, 5, 2),

-- Signalement 5: Prix 1,200,000 * Niveau 6 * 3.50 = 25,200,000
(-18.8755, 47.5085, 'Lampadaire défectueux Boulevard Ranavalona', 'Plusieurs lampadaires sont éteints sur un tronçon de 80 mètres. La zone est très sombre la nuit, augmentant l''insécurité pour les piétons et les risques d''agressions.', 3.50, '2025-01-23 09:00:00', ST_SetSRID(ST_MakePoint(47.5085, -18.8755), 4326)::geography, NOW(), 6, 25200000.00, 4, 2),

-- Signalement 6: Prix 1,200,000 * Niveau 7 * 25.00 = 210,000,000
(-18.8840, 47.5130, 'Trottoir dégradé Rue Rainibetsimisaraka', 'Le trottoir présente de nombreux trous et pavés descellés sur une longueur d''environ 25 mètres. Dangereux pour les piétons, notamment personnes âgées et enfants. Plusieurs chutes signalées.', 25.00, '2025-01-20 11:30:00', ST_SetSRID(ST_MakePoint(47.5130, -18.8840), 4326)::geography, NOW(), 7, 210000000.00, 5, 2),

-- Signalement 7: Prix 1,200,000 * Niveau 10 * 45.00 = 540,000,000
(-18.8795, 47.5110, 'Route inondée saison des pluies Ambodivona', 'La route devient totalement impraticable pendant la saison des pluies. L''eau stagne pendant plusieurs heures, bloquant la circulation. Nécessite un système de drainage efficace et un rehaussement de la chaussée.', 45.00, '2025-01-18 07:45:00', ST_SetSRID(ST_MakePoint(47.5110, -18.8795), 4326)::geography, NOW(), 10, 540000000.00, 2, 2),

-- Signalement 9: Prix 1,200,000 * Niveau 8 * 30.00 = 288,000,000
(-18.8850, 47.5075, 'Fissures importantes RN2 entrée Tana', 'Fissures longitudinales et transversales importantes sur la chaussée. Surface totale affectée d''environ 30 m². Risque d''élargissement rapide en saison des pluies. Nécessite réfection complète.', 30.00, '2025-01-12 15:50:00', ST_SetSRID(ST_MakePoint(47.5075, -18.8850), 4326)::geography, NOW(), 8, 288000000.00, 1, 2),

-- Signalement 10: Prix 1,200,000 * Niveau 7 * 18.75 = 157,500,000
(-18.8780, 47.5125, 'Chaussée défoncée devant marché Andravoahangy', 'Chaussée très détériorée devant le marché avec de nombreux nids de poule et ornières. La boue s''accumule et rend la circulation difficile. Impact économique sur l''activité commerciale du marché.', 18.75, '2025-01-10 08:15:00', ST_SetSRID(ST_MakePoint(47.5125, -18.8780), 4326)::geography, NOW(), 7, 157500000.00, 1, 2),

-- Signalement 12: Prix 1,200,000 * Niveau 9 * 120.00 = 1,296,000,000
(-18.8860, 47.5160, 'Route boueuse impraticable à Soavimasoandro', 'Route en terre non bitumée, complètement boueuse et glissante pendant 6 mois de l''année. Les véhicules s''enlisent régulièrement. Population locale isolée. Bitumage nécessaire.', 120.00, '2025-01-02 14:00:00', ST_SetSRID(ST_MakePoint(47.5160, -18.8860), 4326)::geography, NOW(), 9, 1296000000.00, 2, 2),

-- Signalement 15: Prix 1,000,000 * Niveau 6 * 22.00 = 132,000,000
(-18.8875, 47.5100, 'Détérioration voie publique secteur Isotry', 'Dégradation générale de la voie publique nécessitant une intervention de maintenance. Surface affectée d''environ 22 m². Nombreuses plaintes des riverains.', 22.00, '2024-12-20 16:30:00', ST_SetSRID(ST_MakePoint(47.5100, -18.8875), 4326)::geography, NOW(), 6, 132000000.00, 5, 2);

-- Signalements SANS niveau ni budget (non assignables)
INSERT INTO signalement (latitude, longitude, titre, description, surface_metre_carree, date_creation, geom, last_update, Id_type_travail, Id_utilisateur)
VALUES
-- Signalement 4
(-18.8825, 47.5105, 'Feu tricolore en panne Ambohijatovo', 'Le feu tricolore ne fonctionne plus depuis 5 jours. La circulation est très perturbée aux heures de pointe. Un agent de police doit réguler mais n''est pas toujours présent. Carrefour à haut risque d''accidents.', 2.00, '2025-01-25 16:20:00', ST_SetSRID(ST_MakePoint(47.5105, -18.8825), 4326)::geography, NOW(), 3, 2),

-- Signalement 8
(-18.8770, 47.5150, 'Panneau de signalisation manquant Bypass', 'Le panneau de limitation de vitesse a disparu. Zone à proximité d''une école primaire où les enfants traversent fréquemment. Remplacement urgent nécessaire pour la sécurité des écoliers.', 1.50, '2025-01-15 13:20:00', ST_SetSRID(ST_MakePoint(47.5150, -18.8770), 4326)::geography, NOW(), 3, 2),

-- Signalement 11
(-18.8805, 47.5090, 'Pont endommagé quartier Anosibe', 'Le garde-corps du pont présente des sections endommagées. Structure potentiellement fragilisée. Inspection technique urgente requise pour évaluer la sécurité. Forte fréquentation quotidienne.', 10.00, '2025-01-05 10:30:00', ST_SetSRID(ST_MakePoint(47.5090, -18.8805), 4326)::geography, NOW(), 2, 1),

-- Signalement 13
(-18.8820, 47.5115, 'Grille avaloir cassée Ankorondrano', 'La grille de l''avaloir est cassée, laissant un trou béant dangereux pour les piétons et deux-roues. Plusieurs incidents rapportés. Remplacement urgent de la grille nécessaire.', 2.50, '2024-12-28 09:45:00', ST_SetSRID(ST_MakePoint(47.5115, -18.8820), 4326)::geography, NOW(), 5, 1),

-- Signalement 14
(-18.8745, 47.5135, 'Marquage au sol effacé carrefour Behoririka', 'Le marquage au sol des passages piétons et des lignes de circulation est complètement effacé. Confusion dans la circulation, particulièrement dangereux la nuit et par temps de pluie.', 35.00, '2024-12-25 11:20:00', ST_SetSRID(ST_MakePoint(47.5135, -18.8745), 4326)::geography, NOW(), 3, 1),

-- Signalement 16
(-18.8800, 47.5145, 'Demande éclairage supplémentaire Rue Andrianary', 'Demande d''installation de lampadaires supplémentaires. Zone déjà couverte par éclairage municipal suffisant selon normes en vigueur.', 0.00, '2024-12-15 08:00:00', ST_SetSRID(ST_MakePoint(47.5145, -18.8800), 4326)::geography, NOW(), 4, 1),

-- Signalement 17
(-18.8785, 47.5080, 'Signalement duplicata Avenue Rakotomavo', 'Signalement en doublon, déjà traité sous référence antérieure. Aucune action supplémentaire nécessaire.', 0.00, '2024-12-10 12:30:00', ST_SetSRID(ST_MakePoint(47.5080, -18.8785), 4326)::geography, NOW(), 1, 1);

-- ==========================================
-- TENTATIVES DE CONNEXION
-- ==========================================

INSERT INTO tentative_connexion (date_tentative, success, last_update, Id_utilisateur)
VALUES
-- Manager (ID 1)
('2026-02-10 08:00:00', true, NOW(), 1),
('2026-02-09 08:15:00', true, NOW(), 1),
('2026-02-08 08:30:00', true, NOW(), 1),
('2026-02-07 08:10:00', true, NOW(), 1),
('2026-02-06 08:05:00', true, NOW(), 1),
('2026-02-05 08:20:00', true, NOW(), 1),
('2026-02-04 08:25:00', true, NOW(), 1),
('2026-02-03 08:15:00', true, NOW(), 1),
('2026-02-02 08:10:00', true, NOW(), 1),
('2026-02-01 08:30:00', true, NOW(), 1),

-- Visiteur (ID 2)
('2026-02-10 09:00:00', true, NOW(), 2),
('2026-02-09 14:30:00', true, NOW(), 2),
('2026-02-08 10:15:00', true, NOW(), 2),
('2026-02-07 15:45:00', true, NOW(), 2),
('2026-02-06 11:00:00', true, NOW(), 2),
('2026-02-05 16:20:00', true, NOW(), 2),
('2026-02-04 10:30:00', true, NOW(), 2),
('2026-02-03 14:15:00', true, NOW(), 2),
('2026-02-02 09:45:00', true, NOW(), 2),
('2026-02-01 15:30:00', true, NOW(), 2);

-- ==========================================
-- ASSIGNATIONS ENTREPRISES
-- ==========================================
-- Seulement les signalements avec niveau peuvent avoir des assignations
-- Les montants correspondent aux budgets calculés: prix_m2 * niveau * surface_m2

INSERT INTO entreprise_concerner (date_creation, montant, date_debut, date_fin, last_update, Id_signalement, Id_entreprise, Id_statut_assignation)
VALUES
-- Assignations terminées (Statut 5)
('2024-12-21', 132000000.00, '2024-12-22', '2025-01-15', NOW(), 10, 1, 5),  -- Signalement 10: Budget 132,000,000
('2024-12-29', 1296000000.00, '2024-12-30', '2025-01-20', NOW(), 9, 3, 5),  -- Signalement 9: Budget 1,296,000,000

-- Assignations en cours (Statut 4)
('2025-01-11', 157500000.00, '2025-01-13', '2025-03-10', NOW(), 8, 6, 4),  -- Signalement 8: Budget 157,500,000
('2025-01-13', 288000000.00, '2025-01-15', '2025-02-20', NOW(), 7, 7, 4),  -- Signalement 7: Budget 288,000,000
('2025-01-16', 540000000.00, '2025-01-20', '2025-02-25', NOW(), 6, 8, 4),  -- Signalement 6: Budget 540,000,000
('2025-01-19', 210000000.00, '2025-01-22', '2025-03-05', NOW(), 5, 9, 4),  -- Signalement 5: Budget 210,000,000

-- Assignations acceptées (Statut 2)
('2025-01-21', 25200000.00, '2025-01-25', '2025-03-30', NOW(), 4, 10, 2),  -- Signalement 4: Budget 25,200,000
('2025-01-24', 48000000.00, '2025-02-05', '2025-02-28', NOW(), 3, 11, 2),  -- Signalement 3: Budget 48,000,000

-- Assignations en attente (Statut 1)
('2025-01-29', 164160000.00, '2025-02-10', '2025-03-15', NOW(), 2, 13, 1), -- Signalement 2: Budget 164,160,000

-- Assignations refusées (Statut 3)
('2026-02-01', 130000000.00, '2025-02-15', '2025-03-01', NOW(), 1, 1, 3);  -- Signalement 1: Budget 130,000,000
-- ==========================================
-- HISTORIQUE STATUTS ASSIGNATION
-- ==========================================

INSERT INTO historique_statut_assignation (date_changement, last_update, Id_entreprise_concerner, Id_statut_assignation)
VALUES
-- Historique assignation 1 (Terminée - Signalement 10)
('2024-12-21 09:00:00', NOW(), 1, 1),  -- En attente
('2024-12-23 10:30:00', NOW(), 1, 2),  -- Acceptée
('2024-12-24 08:00:00', NOW(), 1, 4),  -- En cours
('2025-01-15 16:00:00', NOW(), 1, 5),  -- Terminée

-- Historique assignation 2 (Terminée - Signalement 9)
('2024-12-29 08:45:00', NOW(), 2, 1),  -- En attente
('2024-12-30 14:00:00', NOW(), 2, 2),  -- Acceptée
('2025-01-02 09:30:00', NOW(), 2, 4),  -- En cours
('2025-01-20 17:00:00', NOW(), 2, 5),  -- Terminée

-- Historique assignation 3 (En cours - Signalement 8)
('2025-01-11 09:30:00', NOW(), 3, 1),  -- En attente
('2025-01-13 08:00:00', NOW(), 3, 2),  -- Acceptée
('2025-01-14 10:30:00', NOW(), 3, 4),  -- En cours

-- Historique assignation 4 (En cours - Signalement 7)
('2025-01-13 10:45:00', NOW(), 4, 1),  -- En attente
('2025-01-15 09:15:00', NOW(), 4, 2),  -- Acceptée
('2025-01-16 14:00:00', NOW(), 4, 4),  -- En cours

-- Historique assignation 5 (En cours - Signalement 6)
('2025-01-16 08:00:00', NOW(), 5, 1),  -- En attente
('2025-01-18 10:00:00', NOW(), 5, 2),  -- Acceptée
('2025-01-22 09:30:00', NOW(), 5, 4),  -- En cours

-- Historique assignation 6 (En cours - Signalement 5)
('2025-01-19 13:30:00', NOW(), 6, 1),  -- En attente
('2025-01-21 09:00:00', NOW(), 6, 2),  -- Acceptée
('2025-01-24 10:15:00', NOW(), 6, 4),  -- En cours

-- Historique assignation 7 (Acceptée - Signalement 4)
('2025-01-21 11:00:00', NOW(), 7, 1),  -- En attente
('2025-01-23 14:30:00', NOW(), 7, 2),  -- Acceptée

-- Historique assignation 8 (Acceptée - Signalement 3)
('2025-01-24 09:15:00', NOW(), 8, 1),  -- En attente
('2025-01-26 10:45:00', NOW(), 8, 2),  -- Acceptée

-- Historique assignation 9 (En attente - Signalement 2)
('2025-01-29 10:30:00', NOW(), 9, 1),  -- En attente

-- Historique assignation 10 (Refusée - Signalement 1)
('2026-02-01 09:30:00', NOW(), 10, 1),  -- En attente
('2026-02-02 11:00:00', NOW(), 10, 3);  -- Refusée

-- ==========================================
-- HISTORIQUE ÉTATS SIGNALEMENTS
-- ==========================================

INSERT INTO historique_etat_signalement (date_changement_etat, last_update, Id_signalement, Id_etat_signalement)
VALUES
-- SIGNALEMENTS AVEC NIVEAU (assignables)

-- Signalement 1 (En attente)
('2025-02-01 08:30:00', NOW(), 1, 1),

-- Signalement 2 (En attente)
('2025-01-30 14:15:00', NOW(), 2, 1),

-- Signalement 3 (En attente)
('2025-01-28 10:45:00', NOW(), 3, 1),

-- Signalement 4 (En attente)
('2025-01-23 09:00:00', NOW(), 4, 1),

-- Signalement 5 (En cours)
('2025-01-20 11:30:00', NOW(), 5, 1),
('2025-01-22 09:00:00', NOW(), 5, 2),

-- Signalement 6 (En cours)
('2025-01-18 07:45:00', NOW(), 6, 1),
('2025-01-20 10:30:00', NOW(), 6, 2),

-- Signalement 7 (En cours)
('2025-01-15 13:20:00', NOW(), 7, 1),
('2025-01-17 08:00:00', NOW(), 7, 2),

-- Signalement 8 (En cours)
('2025-01-12 15:50:00', NOW(), 8, 1),
('2025-01-14 11:00:00', NOW(), 8, 2),

-- Signalement 9 (Résolu)
('2025-01-02 14:00:00', NOW(), 9, 1),
('2025-01-04 09:30:00', NOW(), 9, 2),
('2025-01-28 15:30:00', NOW(), 9, 3),

-- Signalement 10 (Résolu)
('2024-12-20 16:30:00', NOW(), 10, 1),
('2024-12-22 09:00:00', NOW(), 10, 2),
('2025-01-13 17:00:00', NOW(), 10, 3),

-- SIGNALEMENTS SANS NIVEAU (non assignables)

-- Signalement 11 (En attente)
('2025-01-25 16:20:00', NOW(), 11, 1),

-- Signalement 12 (En attente)
('2025-01-15 13:20:00', NOW(), 12, 1),

-- Signalement 13 (Résolu)
('2025-01-05 10:30:00', NOW(), 13, 1),
('2025-01-07 08:00:00', NOW(), 13, 2),
('2025-01-25 16:00:00', NOW(), 13, 3),

-- Signalement 14 (Résolu)
('2024-12-28 09:45:00', NOW(), 14, 1),
('2024-12-30 08:00:00', NOW(), 14, 2),
('2025-01-18 14:00:00', NOW(), 14, 3),

-- Signalement 15 (Résolu)
('2024-12-25 11:20:00', NOW(), 15, 1),
('2024-12-27 10:00:00', NOW(), 15, 2),
('2025-01-08 16:30:00', NOW(), 15, 3),

-- Signalement 16 (Rejeté)
('2024-12-15 08:00:00', NOW(), 16, 1),
('2024-12-18 10:00:00', NOW(), 16, 4),

-- Signalement 17 (Rejeté)
('2024-12-10 12:30:00', NOW(), 17, 1),
('2024-12-12 14:30:00', NOW(), 17, 4);

-- ==========================================
-- RECOMPUTE SEQUENCES
-- ==========================================

SELECT pg_catalog.setval(
  pg_get_serial_sequence('historique_etat_signalement','id_historique'),
  COALESCE((SELECT MAX(id_historique) FROM historique_etat_signalement), 1)
);
SELECT pg_catalog.setval(pg_get_serial_sequence('tentative_connexion','id_tentative'), COALESCE((SELECT MAX(id_tentative) FROM tentative_connexion), 1));
SELECT pg_catalog.setval(pg_get_serial_sequence('entreprise_concerner','id_entreprise_concerner'), COALESCE((SELECT MAX(id_entreprise_concerner) FROM entreprise_concerner), 1));
SELECT pg_catalog.setval(pg_get_serial_sequence('historique_statut_assignation','id_historique'), COALESCE((SELECT MAX(id_historique) FROM historique_statut_assignation), 1));

COMMIT;
