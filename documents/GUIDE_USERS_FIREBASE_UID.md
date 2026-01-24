# Guide - Ajouter les Users avec Firebase UID
## Création des Utilisateurs de Test dans Firebase et PostgreSQL

---

## 📋 Résumé du Processus

1. **Créer les utilisateurs dans Firebase Console**
2. **Récupérer les Firebase UIDs générés**
3. **Mettre à jour data-reel.sql avec les UIDs**
4. **Insérer les données dans PostgreSQL**

---

## 🔥 Étape 1 : Créer les Utilisateurs dans Firebase Console

### 1.1 Accéder à Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez à **Authentication** (dans le menu de gauche)
4. Cliquez sur l'onglet **Users**

### 1.2 Créer le Premier Utilisateur (Manager - Jean Rakoto)

1. Cliquez sur le bouton **+ Create user** (ou "Ajouter utilisateur")
2. Remplissez les informations:
   - **Email**: `jean.rakoto@signalement.mg`
   - **Password**: `manager123` (ou un mot de passe complexe)
3. Cliquez sur **Create user**

**Résultat:**
- Firebase génère automatiquement un **User ID** (Firebase UID)
- Exemple: `QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb`
- **Notez ce UID** pour plus tard

### 1.3 Créer le Deuxième Utilisateur (Manager - Marie Ravelo)

1. Cliquez sur **+ Create user**
2. Remplissez:
   - **Email**: `marie.ravelo@signalement.mg`
   - **Password**: `manager456`
3. Cliquez sur **Create user**
4. **Notez le Firebase UID généré**

### 1.4 Créer le Troisième Utilisateur (Manager - Patrick Rasolofo)

1. Cliquez sur **+ Create user**
2. Remplissez:
   - **Email**: `patrick.rasolofo@signalement.mg`
   - **Password**: `manager789`
3. Cliquez sur **Create user**
4. **Notez le Firebase UID généré**

### 1.5 Créer le Quatrième Utilisateur (Visiteur - Hery Andriamampianina)

1. Cliquez sur **+ Create user**
2. Remplissez:
   - **Email**: `hery.andria@gmail.com`
   - **Password**: `visiteur123`
3. Cliquez sur **Create user**
4. **Notez le Firebase UID généré**

### 1.6 Créer le Cinquième Utilisateur (Visiteur - Faly Rakotoarison)

1. Cliquez sur **+ Create user**
2. Remplissez:
   - **Email**: `faly.rakoto@yahoo.fr`
   - **Password**: `visiteur456`
3. Cliquez sur **Create user**
4. **Notez le Firebase UID généré**

### 1.7 Créer le Sixième Utilisateur (Visiteur - Naina Raharison)

1. Cliquez sur **+ Create user**
2. Remplissez:
   - **Email**: `naina.rahar@outlook.com`
   - **Password**: `visiteur789`
3. Cliquez sur **Create user**
4. **Notez le Firebase UID généré**

---

## 📋 Étape 2 : Récupérer les Firebase UIDs

### 2.1 Localiser les UIDs dans Firebase Console

Une fois les utilisateurs créés, vous les verrez dans la liste **Users** de Firebase Authentication.

### 2.2 Copier chaque UID

Pour chaque utilisateur:
1. Cliquez sur l'utilisateur dans la liste
2. Le panel de droite affiche le **User ID** (c'est le Firebase UID)
3. Cliquez sur l'icône de copie à côté du UID
4. **Sauvegardez-le** dans un fichier temporaire

### Exemple d'UIDs (à remplacer par vos vrais UIDs):

```
Jean Rakoto:           QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb
Marie Ravelo:          RfBaC2DeEgHiIjKlMnOpQrStUvWxYzBc
Patrick Rasolofo:      SgCbD3EfFhIjIjKlMnOpQrStUvWxYzCd
Hery Andriamampianina: ThDcE4FgGiIjKlMnOpQrStUvWxYzDe
Faly Rakotoarison:     UiEdF5GhHjKlMnOpQrStUvWxYzEfUvWx
Naina Raharison:       VjFeG6HiIlMnOpQrStUvWxYzFgVwXyYz
```

---

## 🗄️ Étape 3 : Mettre à Jour data-reel.sql

### Localisation:
```
base_de_donnee/data-reel.sql
```

### Code à Ajouter - Avant (sans Firebase UID):

```sql
-- Managers
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Rakoto', 'Jean', 'jean.rakoto@signalement.mg', 'manager123', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    
    ('Ravelo', 'Marie', 'marie.ravelo@signalement.mg', 'manager456', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    
    ('Rasolofo', 'Patrick', 'patrick.rasolofo@signalement.mg', 'manager789', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteurs (utilisateurs normaux)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Rakotoarison', 'Faly', 'faly.rakoto@yahoo.fr', 'visiteur456', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Raharison', 'Naina', 'naina.rahar@outlook.com', 'visiteur789', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));
```

### Code à Remplacer - Après (AVEC Firebase UID):

```sql
-- Managers
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Rakoto', 'Jean', 'jean.rakoto@signalement.mg', 'manager123', 'QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    
    ('Ravelo', 'Marie', 'marie.ravelo@signalement.mg', 'manager456', 'RfBaC2DeEgHiIjKlMnOpQrStUvWxYzBc', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager')),
    
    ('Rasolofo', 'Patrick', 'patrick.rasolofo@signalement.mg', 'manager789', 'SgCbD3EfFhIjIjKlMnOpQrStUvWxYzCd', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Manager'));

-- Visiteurs (utilisateurs normaux)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, firebase_uid, is_blocked, last_update, Id_type_utilisateur)
VALUES 
    ('Andriamampianina', 'Hery', 'hery.andria@gmail.com', 'visiteur123', 'ThDcE4FgGiIjKlMnOpQrStUvWxYzDe', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Rakotoarison', 'Faly', 'faly.rakoto@yahoo.fr', 'visiteur456', 'UiEdF5GhHjKlMnOpQrStUvWxYzEfUvWx', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur')),
    
    ('Raharison', 'Naina', 'naina.rahar@outlook.com', 'visiteur789', 'VjFeG6HiIlMnOpQrStUvWxYzFgVwXyYz', false, NOW(),
     (SELECT Id_type_utilisateur FROM type_utilisateur WHERE libelle = 'Visiteur'));
```

**Important:** Remplacez les UIDs d'exemple par vos **vrais Firebase UIDs** récupérés à l'Étape 2!

---

## 🔧 Étape 4 : Insérer les Données dans PostgreSQL

### Option 1: Utiliser pgAdmin (Interface Graphique)

1. Ouvrez **pgAdmin**
2. Connectez-vous à votre base de données PostgreSQL
3. Allez à **Tools** → **Query Tool**
4. Copiez-collez le contenu du fichier `data-reel.sql` mis à jour
5. Cliquez sur **Execute** (bouton ▶)
6. Vérifiez qu'aucune erreur n'apparaît

### Option 2: Utiliser la Ligne de Commande (Terminal)

```bash
# Naviguer vers le répertoire du projet
cd "c:\Users\Mamisoa\Documents\Project cloud s5\Projet_Cloud_S5"

# Exécuter le script SQL
psql -U postgres -d signalement -f base_de_donnee/data-reel.sql
```

### Option 3: Exécuter directement via psql

```bash
# Accéder à la base de données
psql -U postgres -d signalement

# Exécuter le script
\i 'C:/Users/Mamisoa/Documents/Project cloud s5/Projet_Cloud_S5/base_de_donnee/data-reel.sql'

# Quitter psql
\q
```

---

## ✅ Étape 5 : Vérifier l'Insertion

### 5.1 Vérifier les Users dans PostgreSQL

```sql
-- Vérifier tous les utilisateurs
SELECT Id_utilisateur, nom, prenom, email, firebase_uid, is_blocked 
FROM utilisateur 
ORDER BY Id_utilisateur;
```

**Résultat attendu:**
```
Id | nom                | prenom       | email                           | firebase_uid                   | is_blocked
---|--------------------|--------------|---------------------------------|--------------------------------|----------
1  | Rakoto             | Jean         | jean.rakoto@signalement.mg      | QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb | false
2  | Ravelo             | Marie        | marie.ravelo@signalement.mg     | RfBaC2DeEgHiIjKlMnOpQrStUvWxYzBc | false
3  | Rasolofo           | Patrick      | patrick.rasolofo@signalement.mg | SgCbD3EfFhIjIjKlMnOpQrStUvWxYzCd | false
4  | Andriamampianina   | Hery         | hery.andria@gmail.com           | ThDcE4FgGiIjKlMnOpQrStUvWxYzDe | false
5  | Rakotoarison       | Faly         | faly.rakoto@yahoo.fr            | UiEdF5GhHjKlMnOpQrStUvWxYzEfUvWx | false
6  | Raharison          | Naina        | naina.rahar@outlook.com         | VjFeG6HiIlMnOpQrStUvWxYzFgVwXyYz | false
```

### 5.2 Vérifier les Utilisateurs dans Firebase Console

1. Allez à [Firebase Console](https://console.firebase.google.com/)
2. Allez à **Authentication** → **Users**
3. Vérifiez que les 6 utilisateurs sont listés
4. Les états doivent correspondre:
   - ✅ Tous les utilisateurs actifs (pas bloqués)
   - ✅ Chaque utilisateur a un UID unique

---

## 📋 Tableau Récapitulatif des Utilisateurs

| Nom | Prénom | Email | Rôle | Password | Firebase UID |
|-----|--------|-------|------|----------|--------------|
| Rakoto | Jean | jean.rakoto@signalement.mg | Manager | manager123 | `QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb` |
| Ravelo | Marie | marie.ravelo@signalement.mg | Manager | manager456 | `RfBaC2DeEgHiIjKlMnOpQrStUvWxYzBc` |
| Rasolofo | Patrick | patrick.rasolofo@signalement.mg | Manager | manager789 | `SgCbD3EfFhIjIjKlMnOpQrStUvWxYzCd` |
| Andriamampianina | Hery | hery.andria@gmail.com | Visiteur | visiteur123 | `ThDcE4FgGiIjKlMnOpQrStUvWxYzDe` |
| Rakotoarison | Faly | faly.rakoto@yahoo.fr | Visiteur | visiteur456 | `UiEdF5GhHjKlMnOpQrStUvWxYzEfUvWx` |
| Raharison | Naina | naina.rahar@outlook.com | Visiteur | visiteur789 | `VjFeG6HiIlMnOpQrStUvWxYzFgVwXyYz` |

**⚠️ IMPORTANT:** Les UIDs ci-dessus sont des exemples! Utilisez vos vrais UIDs de Firebase.

---

## 🧪 Étape 6 : Tester la Connexion

### 6.1 Tester avec Postman ou REST Client

Utilisez le fichier `Test_Authentification.http`:

```http
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "jean.rakoto@signalement.mg",
  "motDePasse": "manager123"
}
```

**Réponse attendue (200 OK):**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "utilisateur": {
    "idUtilisateur": 1,
    "nom": "Rakoto",
    "prenom": "Jean",
    "email": "jean.rakoto@signalement.mg",
    "firebaseUid": "QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb"
  }
}
```

### 6.2 Tester avec Firebase Frontend

Depuis votre app mobile/web:

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/firebase'

const user = await signInWithEmailAndPassword(
  auth,
  'jean.rakoto@signalement.mg',
  'manager123'
)

console.log('Firebase UID:', user.user.uid)
// Output: Firebase UID: QeAzB1CdEfGhIjKlMnOpQrStUvWxYzAb
```

---

## 📌 Points Importants

### ✅ À Faire
1. **Créer les utilisateurs dans Firebase Console** (pas via API)
2. **Récupérer les UIDs générés** automatiquement par Firebase
3. **Mettre à jour data-reel.sql** avant d'exécuter le script
4. **Vérifier les données** dans PostgreSQL et Firebase

### ❌ À Éviter
- ❌ Ne pas hardcoder les UIDs dans le code (les récupérer de Firebase)
- ❌ Ne pas utiliser des UIDs générés manuellement
- ❌ Ne pas oublier de remplacer les UIDs d'exemple par les vrais
- ❌ Ne pas exécuter data-reel.sql plusieurs fois (il faudra nettoyer les doublons)

### 🔒 Sécurité
- Les **passwords** dans data-reel.sql sont en **plain text** - **À hasher en production!**
- Les **Firebase UIDs** sont **publiques** - pas de problème
- Les données de test ne doivent **jamais** être en production

---

## 🔄 Flux Complet de Synchronisation

```
FIREBASE CONSOLE
  ↓
  Créer 6 utilisateurs avec authentication
  ↓
  Firebase génère automatiquement les UIDs
  ↓
  Récupérer les UIDs
  ↓
UPDATE data-reel.sql
  ↓
  Remplacer les UIDs d'exemple par les vrais UIDs
  ↓
POSTGRESQL
  ↓
  Exécuter data-reel.sql
  ↓
  Insérer 6 utilisateurs avec leurs firebase_uid
  ↓
VÉRIFICATION
  ↓
  Tester la connexion Firebase ← PostgreSQL OK!
```

---

## 📚 Ressources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [pgAdmin Download](https://www.pgadmin.org/download/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Fin du guide - Ajouter les Users avec Firebase UID**
