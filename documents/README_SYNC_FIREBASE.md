# Configuration Firebase pour les Tâches 31 & 32

## Prérequis

### 1. Fichier Service Account (firebase-service-account.json)

Le fichier `firebase-service-account.json` doit déjà être placé dans :
```
back_end/src/main/resources/firebase-service-account.json
```

### 2. Firebase Configuration

La configuration Firebase se trouve dans `documents/text.txt`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCHwO7FV4rGZ2wtfGmcKskykLGt83YNhvQ",
  authDomain: "road-signalement-s5.firebaseapp.com",
  projectId: "road-signalement-s5",
  storageBucket: "road-signalement-s5.firebasestorage.app",
  messagingSenderId: "116450123240",
  appId: "1:116450123240:web:54d98bc8ecb609926a185d"
};
```

**Project ID:** `road-signalement-s5`

## Dépendances Ajoutées

Dans `back_end/pom.xml`:
```xml
<!-- Firebase Admin SDK -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

## Fichiers Créés

### Entités
- ✅ `SynchronisationFirebase.java` - Table de traçabilité des synchronisations

### DTOs
- ✅ `SyncResultDTO.java` - Résultat de synchronisation
- ✅ `FirebaseSignalementDTO.java` - DTO pour les signalements Firebase

### Repositories
- ✅ `SynchronisationFirebaseRepository.java` - Repository pour les synchronisations
- ✅ `HistoriqueEtatSignalementRepository.java` - Ajout méthode `findLatestBySignalement()`

### Services
- ✅ `FirebaseSyncService.java` - Service principal de synchronisation
  - `syncFromFirebase()` - Tâche 31 (Firebase → PostgreSQL)
  - `syncToFirebase()` - Tâche 32 (PostgreSQL → Firebase FULL SYNC)

### Configuration
- ✅ `FirebaseConfig.java` - Configuration Firebase Firestore

### Controllers
- ✅ `SynchronisationController.java` - Endpoints REST
  - `POST /api/sync/from-firebase` - Tâche 31
  - `POST /api/sync/to-firebase` - Tâche 32
  - `POST /api/sync/full` - Synchronisation bidirectionnelle

### Tests HTTP
- ✅ `Test_Synchronisation_Tache_31.http`
- ✅ `Test_Synchronisation_Tache_32.http`

## Collections Firebase Synchronisées

Les 12 collections suivantes sont synchronisées :

1. **type_utilisateur** (référentiel)
2. **utilisateurs** (données utilisateurs)
3. **etat_signalement** (référentiel)
4. **type_travail** (référentiel)
5. **entreprise** (données entreprises)
6. **statut_assignation** (référentiel)
7. **signalements** (données principales)
8. **entreprise_concerner** (relations)
9. **historique_etat_signalement** (historique)
10. **historique_statut_assignation** (historique)
11. **session** (sessions utilisateurs)
12. **tentative_connexion** (tentatives de connexion)

## Utilisation

### Tâche 31: Synchroniser depuis Firebase

Récupère les modifications depuis Firebase vers PostgreSQL avec gestion de conflits (Last-Write-Wins):

```http
POST http://localhost:8080/api/sync/from-firebase
Authorization: Bearer {token_manager}
```

### Tâche 32: Synchroniser vers Firebase (FULL SYNC)

⚠️ **Attention**: Cette opération SUPPRIME toutes les données Firebase et les recrée avec PostgreSQL:

```http
POST http://localhost:8080/api/sync/to-firebase
Authorization: Bearer {token_manager}
```

### Synchronisation Bidirectionnelle

```http
POST http://localhost:8080/api/sync/full
Authorization: Bearer {token_manager}
```

## Prochaines Étapes (TODO)

Les méthodes suivantes sont marquées `TODO` et doivent être implémentées selon le même pattern:

### Tâche 31 (Firebase → PostgreSQL):
- `syncEntreprisesConcernerFromFirebase()`
- `syncHistoriqueEtatFromFirebase()`
- `syncHistoriqueStatutFromFirebase()`
- `syncSessionsFromFirebase()`
- `syncTentativesConnexionFromFirebase()`

### Tâche 32 (PostgreSQL → Firebase):
- `syncAllEntreprisesConcernerToFirebase()`
- `syncAllHistoriqueEtatToFirebase()`
- `syncAllHistoriqueStatutToFirebase()`
- `syncAllSessionsToFirebase()`
- `syncAllTentativesConnexionToFirebase()`

## Tests

1. **Compiler le projet:**
   ```bash
   cd back_end
   mvn clean install
   ```

2. **Lancer l'application:**
   ```bash
   mvn spring-boot:run
   ```

3. **Tester avec les fichiers HTTP:**
   - Utiliser VS Code avec l'extension REST Client
   - Ouvrir `http/Test_Synchronisation_Tache_31.http`
   - Remplacer `@tokenManager` avec un token valide de manager
   - Exécuter les requêtes

## Résolution de Problèmes

### Erreur: "firebase-service-account.json not found"
- Vérifier que le fichier existe dans `src/main/resources/`
- Vérifier les permissions de lecture du fichier

### Erreur: "Permission denied"
- Vérifier que le token utilisé appartient à un manager (type_utilisateur = 2)

### Erreur: "Firestore connection failed"
- Vérifier que le service account a les bonnes permissions sur Firebase
- Vérifier la connexion Internet

## Sécurité

⚠️ **Important**: Le fichier `firebase-service-account.json` contient des credentials sensibles et NE DOIT JAMAIS être commit dans Git.

Vérifier `.gitignore`:
```
**/firebase-service-account.json
```

## Architecture de Synchronisation

### Tâche 31 (Incrémentale avec Conflits)
- Récupère seulement les données modifiées depuis la dernière sync
- Applique Last-Write-Wins en cas de conflit
- Garde l'historique des synchronisations

### Tâche 32 (Full Sync)
- Supprime TOUTES les collections Firebase
- Recrée les collections avec les données PostgreSQL actuelles
- Firebase devient une copie exacte de PostgreSQL

## Support

Pour plus d'informations, consulter:
- `documents/GUIDE_TACHE_31_32.md` - Guide complet d'implémentation
- Firebase Console: https://console.firebase.google.com/project/road-signalement-s5
