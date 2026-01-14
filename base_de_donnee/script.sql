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
   Id_type_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(Id_utilisateur),
   UNIQUE(email),
   FOREIGN KEY(Id_type_utilisateur) REFERENCES type_utilisateur(Id_type_utilisateur)
);

CREATE TABLE signalement(
   Id_signalement SERIAL,
   latidute NUMERIC(15,10) NOT NULL,
   longitude NUMERIC(15,10) NOT NULL,
   Id_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(Id_signalement),
   FOREIGN KEY(Id_utilisateur) REFERENCES utilisateur(Id_utilisateur)
);

CREATE TABLE entreprise_concerner(
   Id_entreprise_concerner SERIAL,
   date_creation DATE,
   montant NUMERIC(15,2),
   Id_signalement INTEGER NOT NULL,
   Id_entreprise INTEGER NOT NULL,
   PRIMARY KEY(Id_entreprise_concerner),
   FOREIGN KEY(Id_signalement) REFERENCES signalement(Id_signalement),
   FOREIGN KEY(Id_entreprise) REFERENCES entreprise(Id_entreprise)
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


CREATE TABLE avancement_signalement(
   Id_signalement INTEGER,
   Id_etat_signalement INTEGER,
   date_changement_etat VARCHAR(50) NOT NULL,
   pourcentage NUMERIC(15,2),
   PRIMARY KEY(Id_signalement, Id_etat_signalement),
   FOREIGN KEY(Id_signalement) REFERENCES signalement(Id_signalement),
   FOREIGN KEY(Id_etat_signalement) REFERENCES etat_signalement(Id_etat_signalement)
);
