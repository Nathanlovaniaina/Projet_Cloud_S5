
-- Utilisateurs de test
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, Id_type_utilisateur)
VALUES ('Test','User','user@example.com','password',1),
       ('Admin','User','admin@example.com','password',2);

-- Sessions de test
-- token valide
INSERT INTO session (token, date_debut, date_fin, Id_utilisateur)
VALUES ('11111111-1111-1111-1111-111111111111', NOW(), NOW() + INTERVAL '8 hours',
   (SELECT Id_utilisateur FROM utilisateur WHERE email='user@example.com'));

-- token expiré
INSERT INTO session (token, date_debut, date_fin, Id_utilisateur)
VALUES ('22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '24 hours', NOW() - INTERVAL '23 hours',
   (SELECT Id_utilisateur FROM utilisateur WHERE email='admin@example.com'));

   -- Signalements de test
   INSERT INTO signalement (titre, description, latitude, longitude, date_creation, Id_utilisateur, url_photo, synced)
   VALUES ('Panneau tombé', 'Un panneau de signalisation est tombé sur la route', -18.879200, 47.507900, NOW(),
      (SELECT Id_utilisateur FROM utilisateur WHERE email='user@example.com'), NULL, FALSE),
          ('Nid de poule', 'Grand nid de poule sur la voie', -18.879300, 47.508000, NOW(),
      (SELECT Id_utilisateur FROM utilisateur WHERE email='admin@example.com'), NULL, FALSE);