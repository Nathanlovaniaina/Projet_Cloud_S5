-- Activer l'extension PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE etat_signalement(
   Id_etat_signalement SERIAL,
   libelle VARCHAR(50) NOT NULL,
   PRIMARY KEY(Id_etat_signalement),
   UNIQUE(libelle)
);

CREATE TABLE type_utilisateur(
   Id_type_utilisateur SERIAL,
   libelle VARCHAR(50) NOT NULL,
   PRIMARY KEY(Id_type_utilisateur),
   UNIQUE(libelle)
);

CREATE TABLE type_travail(
   Id_type_travail SERIAL,
   libelle VARCHAR(50) NOT NULL,
   PRIMARY KEY(Id_type_travail),
   UNIQUE(libelle)
);

CREATE TABLE statut_assignation(
   Id_statut_assignation SERIAL,
   libelle VARCHAR(20) NOT NULL,
   PRIMARY KEY(Id_statut_assignation),
   UNIQUE(libelle)
);

CREATE TABLE entreprise(
   Id_entreprise SERIAL,
   nom_du_compagnie VARCHAR(50) NOT NULL,
   email VARCHAR(50) NOT NULL,
   PRIMARY KEY(Id_entreprise)
);

CREATE TABLE utilisateur(
   Id_utilisateur SERIAL,
   nom VARCHAR(50) NOT NULL,
   prenom VARCHAR(50) NOT NULL,
   email VARCHAR(50) NOT NULL,
   mot_de_passe VARCHAR(50) NOT NULL,
   is_blocked BOOLEAN DEFAULT FALSE,
   last_sync TIMESTAMP,
   synced BOOLEAN DEFAULT FALSE,
   Id_type_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(Id_utilisateur),
   UNIQUE(email),
   FOREIGN KEY(Id_type_utilisateur) REFERENCES type_utilisateur(Id_type_utilisateur)
);

CREATE TABLE signalement(
   Id_signalement SERIAL,
   titre VARCHAR(100) NOT NULL,
   description TEXT,
   latitude NUMERIC(15,10) NOT NULL,
   longitude NUMERIC(15,10) NOT NULL,
   date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   etat_actuel INTEGER NOT NULL DEFAULT 1,
   Id_type_travail INTEGER,
   url_photo VARCHAR(255),
   last_sync TIMESTAMP,
   synced BOOLEAN DEFAULT FALSE,
   Id_utilisateur INTEGER NOT NULL,
   geom GEOGRAPHY(POINT, 4326),
   PRIMARY KEY(Id_signalement),
   FOREIGN KEY(Id_utilisateur) REFERENCES utilisateur(Id_utilisateur),
   FOREIGN KEY(etat_actuel) REFERENCES etat_signalement(Id_etat_signalement),
   FOREIGN KEY(Id_type_travail) REFERENCES type_travail(Id_type_travail)
);

-- Index spatial pour les performances
CREATE INDEX idx_signalement_geom ON signalement USING GIST (geom);

CREATE TABLE entreprise_concerner(
   Id_entreprise_concerner SERIAL,
   date_creation DATE DEFAULT CURRENT_DATE,
   montant NUMERIC(15,2),
   Id_statut_assignation INTEGER DEFAULT 1,
   Id_signalement INTEGER NOT NULL,
   Id_entreprise INTEGER NOT NULL,
   PRIMARY KEY(Id_entreprise_concerner),
   FOREIGN KEY(Id_signalement) REFERENCES signalement(Id_signalement),
   FOREIGN KEY(Id_entreprise) REFERENCES entreprise(Id_entreprise),
   FOREIGN KEY(Id_statut_assignation) REFERENCES statut_assignation(Id_statut_assignation)
);

CREATE TABLE historique_statut_assignation(
   Id_historique SERIAL,
   Id_entreprise_concerner INTEGER NOT NULL,
   Id_statut_assignation INTEGER NOT NULL,
   date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(Id_historique),
   FOREIGN KEY(Id_entreprise_concerner) REFERENCES entreprise_concerner(Id_entreprise_concerner),
   FOREIGN KEY(Id_statut_assignation) REFERENCES statut_assignation(Id_statut_assignation)
);

CREATE TABLE session(
   Id_session SERIAL,
   token VARCHAR(100) NOT NULL,
   date_debut TIMESTAMP NOT NULL,
   date_fin TIMESTAMP NOT NULL,
   Id_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(Id_session),
   FOREIGN KEY(Id_utilisateur) REFERENCES utilisateur(Id_utilisateur)
);

CREATE TABLE tentative_connexion(
   Id_tentative SERIAL,
   date_tentative TIMESTAMP NOT NULL,
   success BOOLEAN NOT NULL,
   Id_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(Id_tentative),
   FOREIGN KEY(Id_utilisateur) REFERENCES utilisateur(Id_utilisateur)
);

CREATE TABLE historique_etat_signalement(
   Id_historique SERIAL,
   Id_signalement INTEGER NOT NULL,
   Id_etat_signalement INTEGER NOT NULL,
   date_changement_etat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(Id_historique),
   FOREIGN KEY(Id_signalement) REFERENCES signalement(Id_signalement),
   FOREIGN KEY(Id_etat_signalement) REFERENCES etat_signalement(Id_etat_signalement)
);
