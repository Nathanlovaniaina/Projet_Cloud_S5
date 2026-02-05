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
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteurs (utilisateurs normaux)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', 'YHNsPqAcw7fUE8Reb7HOFMHYoQm2', false, NOW(),
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


BEGIN;

-- 1) Add ~50 generated signalements near Antananarivo to enrich statistics
-- We use generate_series so the DB assigns primary keys automatically
INSERT INTO signalement (latitude, longitude, titre, description, surface_metre_carree, date_creation, url_photo, geom, last_update, Id_type_travail, Id_utilisateur)
SELECT
  -- latitude: base -18.88 +/- small offset
  (-18.8800 + ((i % 11) - 5) * 0.001)::numeric(15,10) AS latitude,
  -- longitude: base 47.5079 +/- small offset
  (47.5079 + ((i % 13) - 6) * 0.0012)::numeric(15,10) AS longitude,
  ('Signalement de test #' || i) AS titre,
  ('Description générée automatiquement pour les tests statistiques - item ' || i) AS description,
  round((random() * 30 + 0.5)::numeric, 2) AS surface_metre_carree,
  -- spread dates over the last 180 days
  (now() - (i * '3 days'::interval))::timestamp AS date_creation,
  NULL AS url_photo,
  -- geom: ST_MakePoint expects (lon, lat)
  ST_SetSRID(ST_MakePoint((47.5079 + ((i % 13) - 6) * 0.0012)::double precision, (-18.8800 + ((i % 11) - 5) * 0.001)::double precision), 4326)::geography AS geom,
  now() AS last_update,
  -- choose a type by cycling through existing type_travail rows
  (SELECT Id_type_travail FROM type_travail ORDER BY Id_type_travail OFFSET ((i - 1) % (SELECT GREATEST(COUNT(*),1) FROM type_travail)) LIMIT 1) AS Id_type_travail,
  -- choose a user by cycling through existing utilisateurs
  (SELECT Id_utilisateur FROM utilisateur ORDER BY Id_utilisateur OFFSET ((i - 1) % (SELECT GREATEST(COUNT(*),1) FROM utilisateur)) LIMIT 1) AS Id_utilisateur
FROM generate_series(1,50) AS s(i);

-- 2) Add additional tentative_connexion records for statistics (mix of success/failure)
INSERT INTO tentative_connexion (date_tentative, success, last_update, Id_utilisateur)
SELECT
  (now() - ((i * '12 hours'::interval)))::timestamp,
  (i % 4 <> 0) AS success, -- 75% success
  now(),
  (SELECT Id_utilisateur FROM utilisateur ORDER BY Id_utilisateur OFFSET ((i - 1) % (SELECT GREATEST(COUNT(*),1) FROM utilisateur)) LIMIT 1)
FROM generate_series(1,100) AS s(i);

-- 3) Create entreprise_concerner entries for some existing signalements (older ones)
-- We'll attach companies to earliest signalements to simulate assignments
-- Build a CTE with row numbers to generate an index for assignments
WITH s AS (
  SELECT Id_signalement, ROW_NUMBER() OVER (ORDER BY date_creation ASC) AS rn
  FROM signalement
  WHERE date_creation < now()
  ORDER BY date_creation ASC
  LIMIT 20
)
INSERT INTO entreprise_concerner (date_creation, montant, date_debut, date_fin, last_update, Id_signalement, Id_entreprise, Id_statut_assignation)
SELECT
  now() - (rn * '10 days'::interval) AS date_creation,
  (100000 + (rn * 50000))::numeric(15,2) AS montant,
  (now() - (rn * '9 days'::interval))::date AS date_debut,
  (now() + (rn * '5 days'::interval))::date AS date_fin,
  now() AS last_update,
  Id_signalement,
  -- choose an entreprise in round robin
  (SELECT Id_entreprise FROM entreprise ORDER BY Id_entreprise OFFSET ((rn - 1) % (SELECT GREATEST(COUNT(*),1) FROM entreprise)) LIMIT 1),
  -- alternate statuses: EN ATTENTE(1), ACCEPTEE(2), EN_COURS(5), TERMINEE(4)
  (CASE WHEN (rn % 4) = 1 THEN 1 WHEN (rn % 4) = 2 THEN 2 WHEN (rn % 4) = 3 THEN 5 ELSE 4 END)
FROM s;

-- 4) Add historique_statut_assignation entries corresponding to entreprise_concerner
INSERT INTO historique_statut_assignation (date_changement, last_update, Id_entreprise_concerner, Id_statut_assignation)
SELECT
  now() - ((row_number() OVER (ORDER BY Id_entreprise_concerner)) * '2 days'::interval) AS date_changement,
  now() AS last_update,
  Id_entreprise_concerner,
  Id_statut_assignation
FROM entreprise_concerner
WHERE Id_entreprise_concerner IS NOT NULL
ORDER BY Id_entreprise_concerner
LIMIT 20;

-- 5) Recompute sequences to avoid conflicts
SELECT pg_catalog.setval(pg_get_serial_sequence('signalement','id_signalement'), COALESCE((SELECT MAX(id_signalement) FROM signalement), 1));
SELECT pg_catalog.setval(pg_get_serial_sequence('tentative_connexion','id_tentative'), COALESCE((SELECT MAX(id_tentative) FROM tentative_connexion), 1));
SELECT pg_catalog.setval(pg_get_serial_sequence('entreprise_concerner','id_entreprise_concerner'), COALESCE((SELECT MAX(id_entreprise_concerner) FROM entreprise_concerner), 1));
SELECT pg_catalog.setval(pg_get_serial_sequence('historique_statut_assignation','id_historique'), COALESCE((SELECT MAX(id_historique) FROM historique_statut_assignation), 1));

-- 1.5) Add historique_etat_signalement for some signalements to simulate state changes
INSERT INTO historique_etat_signalement (date_changement_etat, last_update, Id_signalement, Id_etat_signalement)
SELECT
  s.date_creation + (gs.j * '2 days'::interval) AS date_changement_etat,
  now() AS last_update,
  s.Id_signalement,
  gs.j + 1 AS Id_etat_signalement  -- 2: En cours, 3: Résolu, 4: Rejeté
FROM (
  SELECT Id_signalement, date_creation, ROW_NUMBER() OVER (ORDER BY Id_signalement) AS rn
  FROM signalement
  ORDER BY Id_signalement
  LIMIT 30  -- for first 30 signalements
) s
CROSS JOIN generate_series(1,3) AS gs(j)
WHERE gs.j <= (s.rn % 3 + 1);  -- vary the number of changes

COMMIT;
