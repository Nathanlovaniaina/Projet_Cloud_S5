# 🚀 Guide d'Exécution - Tests des APIs d'Authentification

Ce guide vous permet de tester rapidement toutes les APIs des tâches 11 à 16.

---

## 📋 Prérequis

✅ PostgreSQL installé et démarré  
✅ Java 17+ installé  
✅ Maven installé  
✅ Extension REST Client (VS Code) ou Postman

---

## 🛠️ Étape 1: Configuration de la Base de Données

### Option A: Ligne de commande PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql:
CREATE DATABASE signalement_db;
\c signalement_db
\i C:/Users/Mamisoa/Documents/Project cloud s5/Projet_Cloud_S5/base_de_donnee/script.sql
\i C:/Users/Mamisoa/Documents/Project cloud s5/Projet_Cloud_S5/base_de_donnee/data-reel.sql
\q
```

### Option B: pgAdmin

1. Ouvrir pgAdmin
2. Créer une nouvelle base: `signalement_db`
3. Ouvrir Query Tool
4. Exécuter le contenu de `base_de_donnee/script.sql`
5. Exécuter le contenu de `base_de_donnee/data-reel.sql`

### Vérification

```sql
-- Dans psql ou pgAdmin
\c signalement_db
SELECT COUNT(*) FROM utilisateur;  -- Doit retourner 9
SELECT COUNT(*) FROM signalement;  -- Doit retourner 6
```

---

## 🏃 Étape 2: Démarrer le Backend

### Dans le terminal (PowerShell)

```powershell
# Aller dans le dossier backend
cd "C:\Users\Mamisoa\Documents\Project cloud s5\Projet_Cloud_S5\back_end"

# Compiler et démarrer
mvn clean install
mvn spring-boot:run
```

### Vérification

Le serveur devrait démarrer sur: `http://localhost:8080`

Vous devriez voir dans les logs:
```
Started SignalementApplication in X.XXX seconds
```

---

## 🧪 Étape 3: Exécuter les Tests

### Option A: Avec VS Code (REST Client)

1. **Installer l'extension REST Client** (si pas déjà fait)
   - Ctrl+Shift+X
   - Chercher "REST Client"
   - Installer

2. **Ouvrir le fichier de test rapide**
   ```
   http/Test_Rapide_Auth.http
   ```

3. **Exécuter les tests**
   - Cliquer sur "Send Request" au-dessus de chaque requête
   - OU: Ctrl+Alt+R sur la ligne de la requête

### Option B: Avec Postman

1. Importer les requêtes manuellement depuis `http/Test_Authentification.http`
2. Configurer la variable `baseUrl = http://localhost:8080/api/auth`
3. Exécuter les requêtes

### Option C: Avec cURL (ligne de commande)

Voir section "Tests avec cURL" ci-dessous

---

## ✅ Tests Essentiels à Exécuter

### Test 1: Inscription (Tâche 11)

```http
POST http://localhost:8080/api/auth/inscription
Content-Type: application/json

{
  "nom": "Test",
  "prenom": "User",
  "email": "test@test.mg",
  "motDePasse": "test123",
  "idTypeUtilisateur": 1
}
```

**Résultat attendu**: 201 Created avec `"success": true`

---

### Test 2: Authentification (Tâche 12)

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "jean.rakoto@signalement.mg",
  "motDePasse": "manager123"
}
```

**Résultat attendu**: 200 OK avec un token dans la réponse

**Copier le token** pour les tests suivants!

---

### Test 3: Modification Utilisateur (Tâche 14)

```http
PUT http://localhost:8080/api/auth/utilisateur/1
Content-Type: application/json
Authorization: VOTRE_TOKEN_ICI

{
  "nom": "Rakoto-Modified"
}
```

**Résultat attendu**: 200 OK avec `"success": true`

---

### Test 4: Blocage (Tâche 15)

Exécuter 3 fois avec des mots de passe incorrects:

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "test@test.mg",
  "motDePasse": "mauvais_password"
}
```

**Résultat attendu**: 
- 1ère tentative: "Il vous reste 2 tentative(s)"
- 2ème tentative: "Il vous reste 1 tentative(s)"
- 3ème tentative: "Compte bloqué"

---

### Test 5: Liste des Bloqués + Déblocage (Tâche 16)

```http
# Lister
GET http://localhost:8080/api/auth/bloques
Authorization: 550e8400-e29b-41d4-a716-446655440000

# Débloquer (ID trouvé dans la liste)
POST http://localhost:8080/api/auth/debloquer/9
Authorization: 550e8400-e29b-41d4-a716-446655440000
```

**Résultat attendu**: Liste des utilisateurs bloqués, puis déblocage réussi

---

## 🖥️ Tests avec cURL

Si vous préférez la ligne de commande:

### Test Inscription
```bash
curl -X POST http://localhost:8080/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d "{\"nom\":\"Test\",\"prenom\":\"User\",\"email\":\"test@test.mg\",\"motDePasse\":\"test123\",\"idTypeUtilisateur\":1}"
```

### Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"jean.rakoto@signalement.mg\",\"motDePasse\":\"manager123\"}"
```

### Test Modification
```bash
curl -X PUT http://localhost:8080/api/auth/utilisateur/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: 550e8400-e29b-41d4-a716-446655440000" \
  -d "{\"nom\":\"Rakoto-Modified\"}"
```

---

## 📊 Matrice de Tests - Validation Complète

| Tâche | Endpoint | Test | Statut |
|-------|----------|------|--------|
| 11 | POST /inscription | Inscription réussie | ⬜ |
| 11 | POST /inscription | Email déjà existant | ⬜ |
| 12 | POST /login | Login réussi | ⬜ |
| 12 | POST /login | Mauvais password | ⬜ |
| 13 | POST /login | Token reçu | ⬜ |
| 13 | POST /logout | Déconnexion | ⬜ |
| 14 | PUT /utilisateur/{id} | Modification réussie | ⬜ |
| 14 | PUT /utilisateur/{id} | Sans autorisation | ⬜ |
| 15 | POST /login | 3 tentatives échouées | ⬜ |
| 15 | POST /login | Compte bloqué | ⬜ |
| 16 | GET /bloques | Liste des bloqués | ⬜ |
| 16 | POST /debloquer/{id} | Déblocage réussi | ⬜ |

Cochez les cases ✅ au fur et à mesure!

---

## 🐛 Résolution de Problèmes

### Erreur: "Connection refused"
- ✅ Vérifier que le backend est démarré
- ✅ Vérifier le port 8080 est libre
- ✅ Vérifier dans les logs: "Started SignalementApplication"

### Erreur: "Could not connect to database"
- ✅ Vérifier que PostgreSQL est démarré
- ✅ Vérifier les credentials dans `application.properties`
- ✅ Vérifier que la base `signalement_db` existe

### Erreur: "Session invalide"
- ✅ Se reconnecter pour obtenir un nouveau token
- ✅ Vérifier que le token est dans le header `Authorization`
- ✅ Vérifier que la session n'a pas expiré (24h)

### Erreur: 404 Not Found
- ✅ Vérifier l'URL: `http://localhost:8080/api/auth/...`
- ✅ Vérifier la méthode HTTP (GET, POST, PUT)
- ✅ Vérifier que le controller est bien chargé

### Logs pour Debug
```bash
# Activer les logs SQL
# Dans application.properties:
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
```

---

## 📱 Tokens Pré-Configurés

Pour tester rapidement sans se reconnecter:

```
Manager Token (jean.rakoto):
550e8400-e29b-41d4-a716-446655440000

Visiteur Token (hery.andria):
650e8400-e29b-41d4-a716-446655440001
```

Ces tokens sont **valides 24h** après l'insertion de `data-reel.sql`

---

## 🎯 Checklist de Validation

Avant de considérer les tâches complétées, vérifier:

- [ ] ✅ Inscription d'un nouvel utilisateur
- [ ] ✅ Connexion avec credentials corrects
- [ ] ✅ Token reçu et utilisable
- [ ] ✅ Modification de son propre profil
- [ ] ✅ 3 tentatives échouées bloquent le compte
- [ ] ✅ Manager peut débloquer un compte
- [ ] ✅ Visiteur ne peut pas débloquer
- [ ] ✅ Session expire après 24h
- [ ] ✅ Déconnexion invalide le token
- [ ] ✅ Toutes les erreurs retournent des messages clairs

---

## 📚 Documentation Complète

- **Documentation API**: `back_end/README_AUTHENTIFICATION.md`
- **Tests complets**: `http/Test_Authentification.http`
- **Tests rapides**: `http/Test_Rapide_Auth.http`
- **Récapitulatif**: `RECAPITULATIF_TACHES_11-16.md`

---

## 💡 Astuces

### Raccourcis VS Code (REST Client)
- `Ctrl+Alt+R` : Envoyer la requête
- `Ctrl+Alt+C` : Annuler la requête
- `Ctrl+Alt+H` : Voir l'historique

### Tester plusieurs scénarios rapidement
1. Utiliser `Test_Rapide_Auth.http`
2. Les tokens sont pré-configurés
3. Exécuter séquentiellement

### Réinitialiser les données
```bash
# Supprimer et recréer
psql -U postgres -c "DROP DATABASE signalement_db;"
psql -U postgres -c "CREATE DATABASE signalement_db;"
psql -U postgres -d signalement_db -f base_de_donnee/script.sql
psql -U postgres -d signalement_db -f base_de_donnee/data-reel.sql
```

---

## ✉️ Support

En cas de problème, vérifier:
1. Les logs du backend (console)
2. Les logs PostgreSQL
3. La documentation: `README_AUTHENTIFICATION.md`

---

**Bon tests! 🚀**
