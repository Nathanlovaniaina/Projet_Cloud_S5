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
    ('Rakoto', 'Jean', 'admin@gmail.com', 'manager123', 'qZo7wYrxotPPEIRbA9BLcMIQOZk1', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    ('Rakoto', 'Jean', 'jean.rakoto@tana.gov.mg', 'manager123', 'PCBxOaX1AsWCgexzdrkidttkN463', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    ('Rasolofo', 'Mialy', 'mialy.rasolofo@tana.gov.mg', 'manager456', 'MGR2Xa9TbpWDhfyzeAljeutulO574', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    ('Andrianaivo', 'Hasina', 'hasina.andrianaivo@tana.gov.mg', 'manager789', 'MGR3Yb0UcqXEigzfBmkjfvuvmP685', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteurs (utilisateurs normaux)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', 'YHNsPqAcw7fUE8Reb7HOFMHYoQm2', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', 'qZo7wYrxotPPEIRbA9BLcMIQOZk1', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Raharison', 'Toky', 'toky.raharison@gmail.com', 'visiteur234', 'USR1Ab1VdrYFjh0gCnlkgwvwnQ796', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Ramanantoanina', 'Feno', 'feno.rama@yahoo.fr', 'visiteur345', 'USR2Bc2WesZGki1hDomhlxwxoR807', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Andrianasolo', 'Lalaina', 'lalaina.solo@hotmail.com', 'visiteur456', 'USR3Cd3XftAHlj2iEpnimyxyqS918', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Rakotondrasoa', 'Volatiana', 'vola.rakoto@gmail.com', 'visiteur567', 'USR4De4YguBImk3jFqojnzyzrT029', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Randriamampionona', 'Narindra', 'narindra.randria@gmail.com', 'visiteur678', 'USR5Ef5ZhvCJnl4kGrpkoAzAsU130', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Rasolofonirina', 'Tsiry', 'tsiry.rasolo@gmail.com', 'visiteur789', 'USR6Fg6AiwDKom5lHsqlpBaBtV241', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Andriamihaja', 'Faniry', 'faniry.mihaja@gmail.com', 'visiteur890', 'USR7Gh7BjxELpn6mItrmqCbCuW352', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Ravoajanahary', 'Tojo', 'tojo.ravoa@yahoo.fr', 'visiteur901', 'USR8Hi8CkyFMqo7nJusnrDcDvX463', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Razafindrakoto', 'Nirina', 'nirina.razafi@gmail.com', 'visiteur012', 'USR9Ij9DlzGNrp8oKvtosEdEwY574', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Rakotomavo', 'Hanta', 'hanta.mavo@hotmail.com', 'visiteur123', 'USR10Jk0EmAHOsq9pLwuptFeFxZ685', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Rasolomanana', 'Fidy', 'fidy.solo@gmail.com', 'visiteur234', 'USR11Kl1FnBIPtr0qMxvquGfGyA796', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Andrianirina', 'Mamy', 'mamy.andria@yahoo.fr', 'visiteur345', 'USR12Lm2GoCJQus1rNywrvHgHzB807', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Rakotondrabe', 'Ny Aina', 'nyaina.rakoto@gmail.com', 'visiteur456', 'USR13Mn3HpDKRvt2sOzxswIhIAC918', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Raharimanana', 'Fara', 'fara.raha@gmail.com', 'visiteur567', 'USR14No4IqELSwu3tPAytxJiJBD029', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    ('Randrianarisoa', 'Tiana', 'tiana.rand@hotmail.com', 'visiteur678', 'USR15Op5JrFMTxv4uQBzuyKjKCE130', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));

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

INSERT INTO signalement (latitude, longitude, titre, description, surface_metre_carree, date_creation, geom, last_update, Id_type_travail, Id_utilisateur)
VALUES
(-18.8765, 47.5120, 'Nids de poule Route Digue', 'Plusieurs nids de poule de 30-50cm de diamètre causent des dommages aux véhicules. Zone très fréquentée par les taxis et bus. Risque d''accidents notamment pour les deux-roues. Intervention urgente requise.', 12.50, '2025-02-01 08:30:00', ST_SetSRID(ST_MakePoint(47.5120, -18.8765), 4326)::geography, NOW(), 1, 1),
(-18.8790, 47.5095, 'Affaissement de chaussée Avenue Indépendance', 'Affaissement progressif de la chaussée sur environ 15 mètres carrés. Présence de fissures en toile d''araignée. La circulation est ralentie et dangereuse, particulièrement pour les poids lourds.', 15.20, '2025-01-30 14:15:00', ST_SetSRID(ST_MakePoint(47.5095, -18.8790), 4326)::geography, NOW(), 1, 2),
(-18.8810, 47.5140, 'Caniveau bouché quartier Analakely', 'Le caniveau est complètement obstrué par des déchets et de la boue. En période de pluie, l''eau stagne et inonde la chaussée. Risque sanitaire et de dégradation accélérée de la route.', 8.00, '2025-01-28 10:45:00', ST_SetSRID(ST_MakePoint(47.5140, -18.8810), 4326)::geography, NOW(), 5, 3),
(-18.8825, 47.5105, 'Feu tricolore en panne Ambohijatovo', 'Le feu tricolore ne fonctionne plus depuis 5 jours. La circulation est très perturbée aux heures de pointe. Un agent de police doit réguler mais n''est pas toujours présent. Carrefour à haut risque d''accidents.', 2.00, '2025-01-25 16:20:00', ST_SetSRID(ST_MakePoint(47.5105, -18.8825), 4326)::geography, NOW(), 3, 4),
(-18.8755, 47.5085, 'Lampadaire défectueux Boulevard Ranavalona', 'Plusieurs lampadaires sont éteints sur un tronçon de 80 mètres. La zone est très sombre la nuit, augmentant l''insécurité pour les piétons et les risques d''agressions.', 3.50, '2025-01-23 09:00:00', ST_SetSRID(ST_MakePoint(47.5085, -18.8755), 4326)::geography, NOW(), 4, 5),
(-18.8840, 47.5130, 'Trottoir dégradé Rue Rainibetsimisaraka', 'Le trottoir présente de nombreux trous et pavés descellés sur une longueur d''environ 25 mètres. Dangereux pour les piétons, notamment personnes âgées et enfants. Plusieurs chutes signalées.', 25.00, '2025-01-20 11:30:00', ST_SetSRID(ST_MakePoint(47.5130, -18.8840), 4326)::geography, NOW(), 5, 6),
(-18.8795, 47.5110, 'Route inondée saison des pluies Ambodivona', 'La route devient totalement impraticable pendant la saison des pluies. L''eau stagne pendant plusieurs heures, bloquant la circulation. Nécessite un système de drainage efficace et un rehaussement de la chaussée.', 45.00, '2025-01-18 07:45:00', ST_SetSRID(ST_MakePoint(47.5110, -18.8795), 4326)::geography, NOW(), 2, 7),
(-18.8770, 47.5150, 'Panneau de signalisation manquant Bypass', 'Le panneau de limitation de vitesse a disparu. Zone à proximité d''une école primaire où les enfants traversent fréquemment. Remplacement urgent nécessaire pour la sécurité des écoliers.', 1.50, '2025-01-15 13:20:00', ST_SetSRID(ST_MakePoint(47.5150, -18.8770), 4326)::geography, NOW(), 3, 8),
(-18.8850, 47.5075, 'Fissures importantes RN2 entrée Tana', 'Fissures longitudinales et transversales importantes sur la chaussée. Surface totale affectée d''environ 30 m². Risque d''élargissement rapide en saison des pluies. Nécessite réfection complète.', 30.00, '2025-01-12 15:50:00', ST_SetSRID(ST_MakePoint(47.5075, -18.8850), 4326)::geography, NOW(), 1, 9),
(-18.8780, 47.5125, 'Chaussée défoncée devant marché Andravoahangy', 'Chaussée très détériorée devant le marché avec de nombreux nids de poule et ornières. La boue s''accumule et rend la circulation difficile. Impact économique sur l''activité commerciale du marché.', 18.75, '2025-01-10 08:15:00', ST_SetSRID(ST_MakePoint(47.5125, -18.8780), 4326)::geography, NOW(), 1, 10),
(-18.8805, 47.5090, 'Pont endommagé quartier Anosibe', 'Le garde-corps du pont présente des sections endommagées. Structure potentiellement fragilisée. Inspection technique urgente requise pour évaluer la sécurité. Forte fréquentation quotidienne.', 10.00, '2025-01-05 10:30:00', ST_SetSRID(ST_MakePoint(47.5090, -18.8805), 4326)::geography, NOW(), 2, 11),
(-18.8860, 47.5160, 'Route boueuse impraticable à Soavimasoandro', 'Route en terre non bitumée, complètement boueuse et glissante pendant 6 mois de l''année. Les véhicules s''enlisent régulièrement. Population locale isolée. Bitumage nécessaire.', 120.00, '2025-01-02 14:00:00', ST_SetSRID(ST_MakePoint(47.5160, -18.8860), 4326)::geography, NOW(), 2, 12),
(-18.8820, 47.5115, 'Grille avaloir cassée Ankorondrano', 'La grille de l''avaloir est cassée, laissant un trou béant dangereux pour les piétons et deux-roues. Plusieurs incidents rapportés. Remplacement urgent de la grille nécessaire.', 2.50, '2024-12-28 09:45:00', ST_SetSRID(ST_MakePoint(47.5115, -18.8820), 4326)::geography, NOW(), 5, 13),
(-18.8745, 47.5135, 'Marquage au sol effacé carrefour Behoririka', 'Le marquage au sol des passages piétons et des lignes de circulation est complètement effacé. Confusion dans la circulation, particulièrement dangereux la nuit et par temps de pluie.', 35.00, '2024-12-25 11:20:00', ST_SetSRID(ST_MakePoint(47.5135, -18.8745), 4326)::geography, NOW(), 3, 14),
(-18.8875, 47.5100, 'Détérioration voie publique secteur Isotry', 'Dégradation générale de la voie publique nécessitant une intervention de maintenance. Surface affectée d''environ 22 m². Nombreuses plaintes des riverains.', 22.00, '2024-12-20 16:30:00', ST_SetSRID(ST_MakePoint(47.5100, -18.8875), 4326)::geography, NOW(), 5, 15),
(-18.8800, 47.5145, 'Demande éclairage supplémentaire Rue Andrianary', 'Demande d''installation de lampadaires supplémentaires. Zone déjà couverte par éclairage municipal suffisant selon normes en vigueur.', 0.00, '2024-12-15 08:00:00', ST_SetSRID(ST_MakePoint(47.5145, -18.8800), 4326)::geography, NOW(), 4, 1),
(-18.8785, 47.5080, 'Signalement duplicata Avenue Rakotomavo', 'Signalement en doublon, déjà traité sous référence antérieure. Aucune action supplémentaire nécessaire.', 0.00, '2024-12-10 12:30:00', ST_SetSRID(ST_MakePoint(47.5080, -18.8785), 4326)::geography, NOW(), 1, 2);

-- ==========================================
-- TENTATIVES DE CONNEXION
-- ==========================================

INSERT INTO tentative_connexion (date_tentative, success, last_update, Id_utilisateur)
VALUES
('2026-02-03 08:00:00', true, NOW(), 1),
('2026-02-03 07:45:00', true, NOW(), 2),
('2026-02-03 07:30:00', true, NOW(), 3),
('2026-02-03 06:00:00', false, NOW(), 4),
('2026-02-02 22:15:00', true, NOW(), 5),
('2026-02-02 20:30:00', true, NOW(), 6),
('2026-02-02 18:45:00', true, NOW(), 7),
('2026-02-02 16:00:00', true, NOW(), 8),
('2026-02-02 14:15:00', true, NOW(), 9),
('2026-02-02 12:30:00', false, NOW(), 10),
('2026-02-02 10:45:00', true, NOW(), 11),
('2026-02-02 09:00:00', true, NOW(), 12),
('2026-02-02 07:15:00', true, NOW(), 13),
('2026-02-01 22:30:00', true, NOW(), 14),
('2026-02-01 20:45:00', true, NOW(), 15),
('2026-02-01 19:00:00', true, NOW(), 1),
('2026-02-01 17:15:00', false, NOW(), 2),
('2026-02-01 15:30:00', true, NOW(), 3),
('2026-02-01 13:45:00', true, NOW(), 4),
('2026-02-01 12:00:00', true, NOW(), 5),
('2026-02-01 10:15:00', true, NOW(), 6),
('2026-02-01 08:30:00', true, NOW(), 7),
('2026-01-31 22:45:00', true, NOW(), 8),
('2026-01-31 20:00:00', false, NOW(), 9),
('2026-01-31 18:15:00', true, NOW(), 10),
('2026-01-31 16:30:00', true, NOW(), 11),
('2026-01-31 14:45:00', true, NOW(), 12),
('2026-01-31 13:00:00', true, NOW(), 13),
('2026-01-31 11:15:00', true, NOW(), 14),
('2026-01-31 09:30:00', true, NOW(), 15),
('2026-01-30 22:00:00', true, NOW(), 1),
('2026-01-30 20:15:00', true, NOW(), 2),
('2026-01-30 18:30:00', true, NOW(), 3),
('2026-01-30 16:45:00', false, NOW(), 4),
('2026-01-30 15:00:00', true, NOW(), 5),
('2026-01-30 13:15:00', true, NOW(), 6),
('2026-01-30 11:30:00', true, NOW(), 7),
('2026-01-30 09:45:00', true, NOW(), 8),
('2026-01-30 08:00:00', true, NOW(), 9),
('2026-01-29 21:30:00', true, NOW(), 10);

-- ==========================================
-- ASSIGNATIONS ENTREPRISES
-- ==========================================

INSERT INTO entreprise_concerner (date_creation, montant, date_debut, date_fin, last_update, Id_signalement, Id_entreprise, Id_statut_assignation)
VALUES
-- Assignations terminées
('2024-12-21', 45000000.00, '2024-12-22', '2025-01-15', NOW(), 15, 1, 5),
('2024-12-26', 8500000.00, '2024-12-27', '2025-01-10', NOW(), 14, 2, 5),
('2024-12-29', 28000000.00, '2024-12-30', '2025-01-20', NOW(), 13, 3, 5),

-- Assignations en cours
('2025-01-03', 65000000.00, '2025-01-05', '2025-02-28', NOW(), 12, 4, 4),
('2025-01-06', 12000000.00, '2025-01-08', '2025-02-15', NOW(), 11, 5, 4),
('2025-01-11', 38000000.00, '2025-01-13', '2025-03-10', NOW(), 10, 6, 4),
('2025-01-13', 22000000.00, '2025-01-15', '2025-02-20', NOW(), 9, 7, 4),

-- Assignations acceptées
('2025-01-16', 9500000.00, '2025-01-20', '2025-02-25', NOW(), 8, 8, 2),
('2025-01-19', 18500000.00, '2025-01-22', '2025-03-05', NOW(), 7, 9, 2),
('2025-01-21', 52000000.00, '2025-01-25', '2025-03-30', NOW(), 6, 10, 2),

-- Assignations en attente
('2025-01-24', 7200000.00, '2025-02-05', '2025-02-28', NOW(), 5, 11, 1),
('2025-01-26', 4500000.00, '2025-02-08', '2025-02-22', NOW(), 4, 12, 1),
('2025-01-29', 15000000.00, '2025-02-10', '2025-03-15', NOW(), 3, 13, 1),

-- Assignations refusées
('2025-01-31', 3200000.00, '2025-02-12', '2025-02-25', NOW(), 2, 14, 3),
('2026-02-01', 5800000.00, '2025-02-15', '2025-03-01', NOW(), 1, 1, 3);
-- ==========================================
-- HISTORIQUE STATUTS ASSIGNATION
-- ==========================================

INSERT INTO historique_statut_assignation (date_changement, last_update, Id_entreprise_concerner, Id_statut_assignation)
VALUES
-- Historique assignation 1 (Terminée)
('2024-12-21 09:00:00', NOW(), 1, 1),
('2024-12-23 10:30:00', NOW(), 1, 2),
('2024-12-24 08:00:00', NOW(), 1, 4),
('2025-01-15 16:00:00', NOW(), 1, 5),

-- Historique assignation 2 (Terminée)
('2024-12-26 10:30:00', NOW(), 2, 1),
('2024-12-27 09:00:00', NOW(), 2, 2),
('2024-12-28 11:00:00', NOW(), 2, 4),
('2025-01-10 15:30:00', NOW(), 2, 5),

-- Historique assignation 3 (Terminée)
('2024-12-29 08:45:00', NOW(), 3, 1),
('2024-12-30 14:00:00', NOW(), 3, 2),
('2025-01-02 09:30:00', NOW(), 3, 4),
('2025-01-20 17:00:00', NOW(), 3, 5),

-- Historique assignation 4 (En cours)
('2025-01-03 11:15:00', NOW(), 4, 1),
('2025-01-05 10:00:00', NOW(), 4, 2),
('2025-01-06 08:30:00', NOW(), 4, 4),

-- Historique assignation 5 (En cours)
('2025-01-06 14:00:00', NOW(), 5, 1),
('2025-01-08 09:00:00', NOW(), 5, 2),
('2025-01-09 11:00:00', NOW(), 5, 4),

-- Historique assignation 6 (En cours)
('2025-01-11 09:30:00', NOW(), 6, 1),
('2025-01-13 08:00:00', NOW(), 6, 2),
('2025-01-14 10:30:00', NOW(), 6, 4),

-- Historique assignation 7 (En cours)
('2025-01-13 10:45:00', NOW(), 7, 1),
('2025-01-15 09:15:00', NOW(), 7, 2),
('2025-01-16 14:00:00', NOW(), 7, 4),

-- Historique assignation 8 (Acceptée)
('2025-01-16 08:00:00', NOW(), 8, 1),
('2025-01-18 10:00:00', NOW(), 8, 2),

-- Historique assignation 9 (Acceptée)
('2025-01-19 13:30:00', NOW(), 9, 1),
('2025-01-21 09:00:00', NOW(), 9, 2),

-- Historique assignation 10 (Acceptée)
('2025-01-21 11:00:00', NOW(), 10, 1),
('2025-01-23 14:30:00', NOW(), 10, 2),

-- Historique assignation 11 (En attente)
('2025-01-24 09:15:00', NOW(), 11, 1),

-- Historique assignation 12 (En attente)
('2025-01-26 14:45:00', NOW(), 12, 1),

-- Historique assignation 13 (En attente)
('2025-01-29 10:30:00', NOW(), 13, 1),

-- Historique assignation 14 (Refusée)
('2025-01-31 08:00:00', NOW(), 14, 1),
('2026-02-01 10:00:00', NOW(), 14, 3),

-- Historique assignation 15 (Refusée)
('2026-02-01 09:30:00', NOW(), 15, 1),
('2026-02-02 11:00:00', NOW(), 15, 3);

-- ==========================================
-- HISTORIQUE ÉTATS SIGNALEMENTS
-- ==========================================

INSERT INTO historique_etat_signalement (date_changement_etat, last_update, Id_signalement, Id_etat_signalement)
VALUES
-- Historique signalement 1 (En attente)
('2025-02-01 08:30:00', NOW(), 1, 1),

-- Historique signalement 2 (En attente)
('2025-01-30 14:15:00', NOW(), 2, 1),

-- Historique signalement 3 (En attente)
('2025-01-28 10:45:00', NOW(), 3, 1),

-- Historique signalement 4 (En attente)
('2025-01-25 16:20:00', NOW(), 4, 1),

-- Historique signalement 5 (En attente)
('2025-01-23 09:00:00', NOW(), 5, 1),

-- Historique signalement 6 (En cours)
('2025-01-20 11:30:00', NOW(), 6, 1),
('2025-01-22 09:00:00', NOW(), 6, 2),

-- Historique signalement 7 (En cours)
('2025-01-18 07:45:00', NOW(), 7, 1),
('2025-01-20 10:30:00', NOW(), 7, 2),

-- Historique signalement 8 (En cours)
('2025-01-15 13:20:00', NOW(), 8, 1),
('2025-01-17 08:00:00', NOW(), 8, 2),

-- Historique signalement 9 (En cours)
('2025-01-12 15:50:00', NOW(), 9, 1),
('2025-01-14 11:00:00', NOW(), 9, 2),

-- Historique signalement 10 (En cours)
('2025-01-10 08:15:00', NOW(), 10, 1),
('2025-01-12 09:30:00', NOW(), 10, 2),

-- Historique signalement 11 (Résolu)
('2025-01-05 10:30:00', NOW(), 11, 1),
('2025-01-07 08:00:00', NOW(), 11, 2),
('2025-01-25 16:00:00', NOW(), 11, 3),

-- Historique signalement 12 (Résolu)
('2025-01-02 14:00:00', NOW(), 12, 1),
('2025-01-04 09:30:00', NOW(), 12, 2),
('2025-01-28 15:30:00', NOW(), 12, 3),

-- Historique signalement 13 (Résolu)
('2024-12-28 09:45:00', NOW(), 13, 1),
('2024-12-30 08:00:00', NOW(), 13, 2),
('2025-01-18 14:00:00', NOW(), 13, 3),

-- Historique signalement 14 (Résolu)
('2024-12-25 11:20:00', NOW(), 14, 1),
('2024-12-27 10:00:00', NOW(), 14, 2),
('2025-01-08 16:30:00', NOW(), 14, 3),

-- Historique signalement 15 (Résolu)
('2024-12-20 16:30:00', NOW(), 15, 1),
('2024-12-22 09:00:00', NOW(), 15, 2),
('2025-01-13 17:00:00', NOW(), 15, 3),

-- Historique signalement 16 (Rejeté)
('2024-12-15 08:00:00', NOW(), 16, 1),
('2024-12-18 10:00:00', NOW(), 16, 4),

-- Historique signalement 17 (Rejeté)
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
