-- ===========================
-- Données de Test pour Tâches 27 et 28
-- Assignation d'Entreprises aux Signalements
-- ===========================

-- Note: Ce script suppose que data-reel.sql a déjà été exécuté
-- Il contient déjà les statuts d'assignation et les entreprises

BEGIN;

-- ===========================
-- Vérification des statuts d'assignation
-- ===========================
SELECT * FROM statut_assignation ORDER BY id_statut_assignation;
-- Résultat attendu:
-- ID 1: En attente
-- ID 2: Accepté
-- ID 3: Refusé
-- ID 4: En cours
-- ID 5: Terminé

-- ===========================
-- Vérification des entreprises
-- ===========================
SELECT * FROM entreprise ORDER BY id_entreprise;
-- Résultat attendu:
-- ID 1: TP SAHONDRA
-- ID 2: COLAS Madagascar
-- ID 3: SOGEA SATOM

-- ===========================
-- Vérification des signalements disponibles
-- ===========================
SELECT 
  id_signalement,
  titre,
  description
FROM signalement
ORDER BY id_signalement
LIMIT 10;

-- ===========================
-- Consulter toutes les assignations
-- ===========================
SELECT 
  ec.id_entreprise_concerner,
  s.id_signalement,
  s.titre AS signalement_titre,
  e.nom_du_compagnie AS entreprise,
  sa.libelle AS statut,
  ec.date_debut,
  ec.date_fin,
  ec.montant,
  ec.date_creation,
  ec.last_update
FROM entreprise_concerner ec
JOIN signalement s ON ec.id_signalement = s.id_signalement
JOIN entreprise e ON ec.id_entreprise = e.id_entreprise
JOIN statut_assignation sa ON ec.id_statut_assignation = sa.id_statut_assignation
ORDER BY ec.last_update DESC;

-- ===========================
-- Consulter l'historique des changements de statut
-- ===========================
SELECT 
  hsa.id_historique,
  s.titre AS signalement,
  e.nom_du_compagnie AS entreprise,
  sa.libelle AS statut,
  hsa.date_changement,
  ec.id_entreprise_concerner
FROM historique_statut_assignation hsa
JOIN entreprise_concerner ec ON hsa.id_entreprise_concerner = ec.id_entreprise_concerner
JOIN signalement s ON ec.id_signalement = s.id_signalement
JOIN entreprise e ON ec.id_entreprise = e.id_entreprise
JOIN statut_assignation sa ON hsa.id_statut_assignation = sa.id_statut_assignation
ORDER BY hsa.date_changement DESC
LIMIT 20;

-- ===========================
-- Statistiques des assignations par statut
-- ===========================
SELECT 
  sa.libelle AS statut,
  COUNT(*) AS nombre_assignations,
  SUM(ec.montant) AS montant_total
FROM entreprise_concerner ec
JOIN statut_assignation sa ON ec.id_statut_assignation = sa.id_statut_assignation
GROUP BY sa.id_statut_assignation, sa.libelle
ORDER BY sa.id_statut_assignation;

-- ===========================
-- Signalements assignés par entreprise
-- ===========================
SELECT 
  e.nom_du_compagnie AS entreprise,
  COUNT(*) AS nombre_signalements_assignes,
  SUM(ec.montant) AS montant_total,
  COUNT(CASE WHEN sa.libelle = 'Terminé' THEN 1 END) AS projets_termines,
  COUNT(CASE WHEN sa.libelle = 'En cours' THEN 1 END) AS projets_en_cours
FROM entreprise e
LEFT JOIN entreprise_concerner ec ON e.id_entreprise = ec.id_entreprise
LEFT JOIN statut_assignation sa ON ec.id_statut_assignation = sa.id_statut_assignation
GROUP BY e.id_entreprise, e.nom_du_compagnie
ORDER BY nombre_signalements_assignes DESC;

-- ===========================
-- Signalements non assignés
-- ===========================
SELECT 
  s.id_signalement,
  s.titre,
  s.description,
  s.date_creation
FROM signalement s
LEFT JOIN entreprise_concerner ec ON s.id_signalement = ec.id_signalement
WHERE ec.id_entreprise_concerner IS NULL
ORDER BY s.date_creation DESC
LIMIT 10;

-- ===========================
-- Supprimer les assignations de test (si nécessaire)
-- ===========================
-- ATTENTION: Décommenter seulement si vous voulez supprimer les données de test
-- DELETE FROM historique_statut_assignation 
-- WHERE id_entreprise_concerner IN (
--     SELECT id_entreprise_concerner FROM entreprise_concerner 
--     WHERE date_creation >= CURRENT_DATE
-- );
-- 
-- DELETE FROM entreprise_concerner 
-- WHERE date_creation >= CURRENT_DATE;

COMMIT;

-- ===========================
-- Requêtes utiles pour le débogage
-- ===========================

-- Trouver une assignation spécifique
-- SELECT * FROM entreprise_concerner 
-- WHERE id_signalement = 1 AND id_entreprise = 1;

-- Voir tous les changements de statut d'une assignation
-- SELECT 
--   hsa.*,
--   sa.libelle AS statut
-- FROM historique_statut_assignation hsa
-- JOIN statut_assignation sa ON hsa.id_statut_assignation = sa.id_statut_assignation
-- WHERE hsa.id_entreprise_concerner = 1
-- ORDER BY hsa.date_changement DESC;
