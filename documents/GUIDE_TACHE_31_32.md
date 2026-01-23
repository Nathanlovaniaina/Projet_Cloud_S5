# GUIDE - TÂCHES 31 & 32: SYNCHRONISATION FIREBASE

**Date**: 2026-01-22  
**Module**: Backend - Synchronisation  
**Responsable**: ETU003241  
**Durée estimée**: 360 minutes (180 min × 2 tâches)

---

## 📋 CONTEXTE

### Objectif Global
Implémenter un système de synchronisation bidirectionnelle entre la base de données PostgreSQL locale et Firebase pour permettre:
1. **Tâche 31**: Récupération des données depuis Firebase vers PostgreSQL
2. **Tâche 32**: Envoi des données depuis PostgreSQL vers Firebase

### Architecture Existante

#### Tables avec `last_update`
Toutes les tables principales ont déjà une colonne `last_update` avec lifecycle callbacks (`@PrePersist` et `@PreUpdate`):

```java
@Column(name = "last_update", nullable = false)
private LocalDateTime lastUpdate;

@PrePersist
@PreUpdate
protected void onUpdate() {
    lastUpdate = LocalDateTime.now();
}
```

**Tables concernées**:
- ✅ `utilisateur`
- ✅ `signalement`
- ✅ `etat_signalement`
- ✅ `type_utilisateur`
- ✅ `type_travail`
- ✅ `entreprise`
- ✅ `statut_assignation`
- ✅ `entreprise_concerner`
- ✅ `session`
- ✅ `tentative_connexion`
- ✅ `historique_etat_signalement`
- ✅ `historique_statut_assignation`

#### Table de traçabilité
```sql
CREATE TABLE synchronisation_firebase(
   Id_synchronisation_firebase SERIAL,
   remarque TEXT,
   date_synchronisation TIMESTAMP NOT NULL,
   success BOOLEAN NOT NULL,
   PRIMARY KEY(Id_synchronisation_firebase)
);
```

### Configuration Firebase Existante
Fichier: `firebase_config/web/config.js`
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB-bnLys5qhH2dgrLJw6wkpQ2uetHni1Iw",
  authDomain: "road-report-auth-projets5.firebaseapp.com",
  projectId: "road-report-auth-projets5",
  storageBucket: "road-report-auth-projets5.firebasestorage.app",
  messagingSenderId: "301784125105",
  appId: "1:301784125105:web:d0e2da62f2353da9f11c90"
};
```

---

## 🎯 TÂCHE 31 - RÉCUPÉRATION DEPUIS FIREBASE

### Objectif
Créer un endpoint permettant de synchroniser les données depuis Firebase Firestore vers PostgreSQL en utilisant `last_update` pour identifier les données modifiées.

### Stratégie de Synchronisation

#### Principe
**Tâche 31 - Récupération depuis Firebase** :
1. Récupérer la date de dernière synchronisation réussie depuis `synchronisation_firebase`
2. Récupérer UNIQUEMENT les **signalements** depuis Firebase (seule donnée créée par les mobiles)
3. Pour chaque signalement où `last_update` > dernière sync :
   - Comparer avec PostgreSQL
   - Insérer ou mettre à jour
4. Enregistrer le résultat dans `synchronisation_firebase`

**Tâche 32 - Envoi vers Firebase** :
1. **SUPPRIMER toutes les collections existantes** dans Firebase
2. **Recréer toutes les collections** avec les données PostgreSQL actuelles
3. Enregistrer le résultat dans `synchronisation_firebase`

> ⚠️ **Important**: Les utilisateurs mobiles créent uniquement des signalements. Toutes les autres données (utilisateurs, états, types, entreprises) sont en **lecture seule** pour les mobiles et doivent être synchronisées depuis PostgreSQL.

#### Collections Firebase (Tâche 32)
```
/signalements/{id}                    ← Modifiable par mobile
/utilisateurs/{id}                    ← Lecture seule (pour affichage)
/etat_signalement/{id}                ← Lecture seule (pour filtres)
/type_travail/{id}                    ← Lecture seule (pour formulaires)
/type_utilisateur/{id}                ← Lecture seule (pour auth)
/entreprise/{id}                      ← Lecture seule (pour affichage)
/statut_assignation/{id}              ← Lecture seule (pour affichage)
/entreprise_concerner/{id}            ← Lecture seule (assignations)
/historique_etat_signalement/{id}     ← Lecture seule (historique états)
/historique_statut_assignation/{id}   ← Lecture seule (historique assignations)
```

> **Note**: Les tables `session` et `tentative_connexion` ne sont PAS synchronisées (données internes PostgreSQL uniquement)

---

### ÉTAPE 1: Créer l'Entité SynchronisationFirebase

**Fichier**: `back_end/src/main/java/com/signalement/entity/SynchronisationFirebase.java`

```java
package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "synchronisation_firebase")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SynchronisationFirebase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_synchronisation_firebase")
    private Integer idSynchronisationFirebase;

    @Column(name = "remarque", columnDefinition = "TEXT")
    private String remarque;

    @Column(name = "date_synchronisation", nullable = false)
    private LocalDateTime dateSynchronisation;

    @Column(name = "success", nullable = false)
    private Boolean success;
}
```

---

### ÉTAPE 2: Créer le Repository

**Fichier**: `back_end/src/main/java/com/signalement/repository/SynchronisationFirebaseRepository.java`

```java
package com.signalement.repository;

import com.signalement.entity.SynchronisationFirebase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SynchronisationFirebaseRepository extends JpaRepository<SynchronisationFirebase, Integer> {
    
    /**
     * Récupérer la date de la dernière synchronisation réussie (depuis Firebase)
     */
    @Query("SELECT MAX(s.dateSynchronisation) FROM SynchronisationFirebase s WHERE s.success = true AND s.remarque LIKE '%Firebase%PostgreSQL%'")
    Optional<LocalDateTime> findLastSuccessfulSyncFromFirebaseDate();
    
    /**
     * Récupérer les 10 dernières synchronisations
     */
    @Query("SELECT s FROM SynchronisationFirebase s ORDER BY s.dateSynchronisation DESC")
    List<SynchronisationFirebase> findTop10ByOrderByDateSynchronisationDesc();
}
```

---

### ÉTAPE 3: Ajouter Firebase Admin SDK au pom.xml

**Fichier**: `back_end/pom.xml`

Ajouter dans la section `<dependencies>`:

```xml
<!-- Firebase Admin SDK -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

---

### ÉTAPE 4: Configuration Firebase

**Fichier**: `back_end/src/main/java/com/signalement/config/FirebaseConfig.java`

```java
package com.signalement.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Bean
    public Firestore firestore() throws IOException {
        // Initialiser Firebase si ce n'est pas déjà fait
        if (FirebaseApp.getApps().isEmpty()) {
            // Option 1: Utiliser les credentials par défaut (GOOGLE_APPLICATION_CREDENTIALS)
            // FirebaseOptions options = FirebaseOptions.builder()
            //     .setCredentials(GoogleCredentials.getApplicationDefault())
            //     .build();
            
            // Option 2: Utiliser un fichier de service account
            InputStream serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

            FirebaseApp.initializeApp(options);
        }

        return FirestoreClient.getFirestore();
    }
}
```

**⚠️ NOTE**: Vous devez placer le fichier `firebase-service-account.json` dans `back_end/src/main/resources/`

**Comment obtenir le fichier service account**:
1. Aller sur Firebase Console: https://console.firebase.google.com/
2. Projet: `road-report-auth-projets5`
3. Settings > Service Accounts
4. Cliquer "Generate new private key"
5. Renommer le fichier en `firebase-service-account.json`
6. Le placer dans `src/main/resources/`

---

### ÉTAPE 5: Créer les DTOs de Synchronisation

**Fichier**: `back_end/src/main/java/com/signalement/dto/SyncResultDTO.java`

```java
package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncResultDTO {
    private boolean success;
    private LocalDateTime syncDate;
    private String message;
    private Map<String, Integer> stats; // Collection -> Nombre d'items synchronisés
    private String error;
}
```

**Fichier**: `back_end/src/main/java/com/signalement/dto/FirebaseSignalementDTO.java`

```java
package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FirebaseSignalementDTO {
    private String firebaseId;
    private String titre;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal surfaceMetreCarree;
    private LocalDateTime dateCreation;
    private String urlPhoto;
    private LocalDateTime lastUpdate;
    private Integer idTypeTravail;
    private Integer idUtilisateur;
    private Integer idEtatSignalement;
}
```

---

### ÉTAPE 6: Créer le Service de Synchronisation

**Fichier**: `back_end/src/main/java/com/signalement/service/FirebaseSyncService.java`

```java
package com.signalement.service;

import com.google.cloud.firestore.*;
import com.signalement.dto.FirebaseSignalementDTO;
import com.signalement.dto.SyncResultDTO;
import com.signalement.entity.*;
import com.signalement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseSyncService {

    private final Firestore firestore;
    private final SignalementRepository signalementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TypeTravailRepository typeTravailRepository;
    private final TypeUtilisateurRepository typeUtilisateurRepository;
    private final EtatSignalementRepository etatSignalementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final StatutAssignationRepository statutAssignationRepository;
    private final EntrepriseConcernerRepository entrepriseConcernerRepository;
    private final HistoriqueEtatSignalementRepository historiqueEtatRepository;
    private final HistoriqueStatutAssignationRepository historiqueStatutRepository;
    private final SynchronisationFirebaseRepository syncRepository;

    /**
     * TÂCHE 31: Synchroniser depuis Firebase vers PostgreSQL
     * UNIQUEMENT les signalements créés par les mobiles
     */
    @Transactional
    public SyncResultDTO syncFromFirebase() {
        LocalDateTime syncStartTime = LocalDateTime.now();
        Map<String, Integer> stats = new HashMap<>();
        int totalSynced = 0;

        try {
            // 1. Récupérer la date de dernière synchronisation
            LocalDateTime lastSyncDate = syncRepository.findLastSuccessfulSyncFromFirebaseDate()
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0)); // Date par défaut

            log.info("Démarrage synchronisation Firebase -> PostgreSQL depuis {}", lastSyncDate);

            // 2. Synchroniser UNIQUEMENT les signalements (seule donnée créée par mobile)
            int signalementsSynced = syncSignalementsFromFirebase(lastSyncDate);
            stats.put("signalements", signalementsSynced);
            totalSynced += signalementsSynced;

            // 3. Enregistrer la synchronisation réussie
            SynchronisationFirebase sync = new SynchronisationFirebase();
            sync.setDateSynchronisation(syncStartTime);
            sync.setSuccess(true);
            sync.setRemarque(String.format("Sync Firebase->PostgreSQL: %d signalements", totalSynced));
            syncRepository.save(sync);

            log.info("Synchronisation terminée avec succès: {} signalements", totalSynced);

            return new SyncResultDTO(
                true,
                syncStartTime,
                "Synchronisation réussie depuis Firebase",
                stats,
                null
            );

        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation Firebase", e);

            // Enregistrer l'échec
            SynchronisationFirebase sync = new SynchronisationFirebase();
            sync.setDateSynchronisation(syncStartTime);
            sync.setSuccess(false);
            sync.setRemarque("Erreur Firebase->PostgreSQL: " + e.getMessage());
            syncRepository.save(sync);

            return new SyncResultDTO(
                false,
                syncStartTime,
                "Échec de la synchronisation depuis Firebase",
                stats,
                e.getMessage()
            );
        }
    }

    /**
     * Synchroniser les signalements depuis Firebase
     */
    private int syncSignalementsFromFirebase(LocalDateTime since) throws ExecutionException, InterruptedException {
        CollectionReference signalements = firestore.collection("signalements");
        
        // Récupérer les documents modifiés depuis la dernière sync
        Query query = signalements.whereGreaterThan("last_update", 
            since.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        ApiFuture<QuerySnapshot> querySnapshot = query.get();
        List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();

        int synced = 0;
        for (QueryDocumentSnapshot document : documents) {
            try {
                FirebaseSignalementDTO firebaseSignalement = document.toObject(FirebaseSignalementDTO.class);
                firebaseSignalement.setFirebaseId(document.getId());

                // Synchroniser le signalement
                syncSignalement(firebaseSignalement);
                synced++;

            } catch (Exception e) {
                log.error("Erreur lors de la sync du signalement {}: {}", document.getId(), e.getMessage());
            }
        }

        return synced;
    }

    /**
     * Synchroniser un signalement individuel
     */
    private void syncSignalement(FirebaseSignalementDTO firebaseDto) {
        // Vérifier si le signalement existe déjà en cherchant par Firebase ID
        // Pour cela, il faudrait ajouter une colonne firebase_id dans la table signalement
        // OU utiliser un mapping externe
        
        // Pour simplifier, on va créer un nouveau signalement si le titre n'existe pas
        List<Signalement> existing = signalementRepository
            .findByLatitudeAndLongitudeAndTitre(
                firebaseDto.getLatitude(),
                firebaseDto.getLongitude(),
                firebaseDto.getTitre()
            );

        if (existing.isEmpty()) {
            // Créer un nouveau signalement
            Signalement signalement = new Signalement();
            signalement.setTitre(firebaseDto.getTitre());
            signalement.setDescription(firebaseDto.getDescription());
            signalement.setLatitude(firebaseDto.getLatitude());
            signalement.setLongitude(firebaseDto.getLongitude());
            signalement.setSurfaceMetreCarree(firebaseDto.getSurfaceMetreCarree());
            signalement.setDateCreation(firebaseDto.getDateCreation());
            signalement.setUrlPhoto(firebaseDto.getUrlPhoto());

            // Récupérer les relations
            TypeTravail typeTravail = typeTravailRepository.findById(firebaseDto.getIdTypeTravail())
                .orElseThrow(() -> new IllegalArgumentException("Type travail introuvable"));
            signalement.setTypeTravail(typeTravail);

            Utilisateur utilisateur = utilisateurRepository.findById(firebaseDto.getIdUtilisateur())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
            signalement.setUtilisateur(utilisateur);

            // Sauvegarder le signalement
            signalement = signalementRepository.save(signalement);

            // Créer l'historique d'état
            if (firebaseDto.getIdEtatSignalement() != null) {
                EtatSignalement etat = etatSignalementRepository.findById(firebaseDto.getIdEtatSignalement())
                    .orElse(null);

                if (etat != null) {
                    HistoriqueEtatSignalement historique = new HistoriqueEtatSignalement();
                    historique.setSignalement(signalement);
                    historique.setEtatSignalement(etat);
                    historique.setDateChangement(firebaseDto.getDateCreation());
                    historiqueEtatRepository.save(historique);
                }
            }

            log.info("Signalement créé depuis Firebase: {}", signalement.getIdSignalement());
        } else {
            // Mettre à jour le signalement existant
            Signalement signalement = existing.get(0);
            
            // Vérifier si la version Firebase est plus récente
            if (firebaseDto.getLastUpdate().isAfter(signalement.getLastUpdate())) {
                signalement.setTitre(firebaseDto.getTitre());
                signalement.setDescription(firebaseDto.getDescription());
                signalement.setUrlPhoto(firebaseDto.getUrlPhoto());
                
                signalementRepository.save(signalement);
                log.info("Signalement mis à jour depuis Firebase: {}", signalement.getIdSignalement());
            }
        }
    }
}
```

---

### ÉTAPE 7: Ajouter la Méthode au Repository

**Fichier**: `back_end/src/main/java/com/signalement/repository/SignalementRepository.java`

Ajouter:

```java
/**
 * Chercher un signalement par position et titre (pour éviter les doublons lors de la sync)
 */
List<Signalement> findByLatitudeAndLongitudeAndTitre(
    BigDecimal latitude, 
    BigDecimal longitude, 
    String titre
);
```

---

### ÉTAPE 8: Créer le Contrôleur

**Fichier**: `back_end/src/main/java/com/signalement/controller/SynchronisationController.java`

```java
package com.signalement.controller;

import com.signalement.dto.ApiResponse;
import com.signalement.dto.SyncResultDTO;
import com.signalement.entity.Utilisateur;
import com.signalement.service.FirebaseSyncService;
import com.signalement.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Tag(name = "Synchronisation", description = "API de synchronisation avec Firebase")
public class SynchronisationController {

    private final FirebaseSyncService syncService;
    private final SessionService sessionService;

    @Operation(
        summary = "Synchroniser depuis Firebase (Tâche 31)",
        description = "Récupère les données modifiées depuis Firebase et les synchronise avec PostgreSQL. Réservé aux managers."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Synchronisation réussie",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResultDTO.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "Non authentifié"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "403", 
            description = "Accès refusé - Réservé aux managers"
        )
    })
    @PostMapping("/from-firebase")
    public ResponseEntity<ApiResponse> syncFromFirebase(
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Authentification requise"));
        }

        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(manager -> {
                // Vérifier que c'est un manager
                if (manager.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Seuls les managers peuvent lancer la synchronisation"));
                }

                // Lancer la synchronisation
                SyncResultDTO result = syncService.syncFromFirebase();
                
                if (result.isSuccess()) {
                    return ResponseEntity.ok(
                        new ApiResponse(true, result.getMessage(), result));
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse(false, result.getMessage(), result));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Token invalide")));
    }
}
```

---

### ÉTAPE 9: Tests HTTP

**Fichier**: `http/Test_Synchronisation_Tache_31.http`

```http
### ============================================================
### TÂCHE 31 - SYNCHRONISATION DEPUIS FIREBASE
### ============================================================

### Configuration
@baseUrl = http://localhost:8080/api
@tokenManager = 0e9d9824-696e-4535-865e-321d05cf209e

### T31-1: Lancer la synchronisation depuis Firebase (Manager)
POST {{baseUrl}}/sync/from-firebase
Authorization: Bearer {{tokenManager}}
Content-Type: application/json

###

### T31-2: Tenter avec un token visiteur (devrait échouer)
@tokenVisiteur = votre-token-visiteur-ici
POST {{baseUrl}}/sync/from-firebase
Authorization: Bearer {{tokenVisiteur}}
Content-Type: application/json

###

### T31-3: Sans authentification (devrait échouer)
POST {{baseUrl}}/sync/from-firebase
Content-Type: application/json

###
```

---
**REMPLACER COMPLÈTEMENT** toutes les données Firebase par les données PostgreSQL actuelles.

### Stratégie (Full Sync)
1. **SUPPRIMER** toutes les collections Firebase existantes
2. **RECRÉER** toutes les collections avec les données PostgreSQL:
   - `signalements` (modifiable par mobile)
   - `utilisateurs` (lecture seule pour mobile)
   - `etat_signalement` (lecture seule)
   - `type_travail` (lecture seule)
   - `type_utilisateur` (lecture seule)
   - `entreprise` (lecture seule)
   - `statut_assignation` (lecture seule)
3. Enregistrer le résultat

> ⚠️ **Attention**: Cette approche supprime TOUT dans Firebase et recrée les données. Utilisez avec précaution.

---

### ÉTAPE 1: Ajouter une Méthode au Service

**Fichier**: `back_end/src/main/java/com/signalement/service/FirebaseSyncService.java`

Ajouter:

```java
/**
 * TÂCHE 32: Synchroniser depuis PostgreSQL vers Firebase
 * FULL SYNC: Supprime tout et recrée toutes les collections
 */
@Transactional(readOnly = true)
public SyncResultDTO syncToFirebase() {
    LocalDateTime syncStartTime = LocalDateTime.now();
    Map<String, Integer> stats = new HashMap<>();
    int totalSynced = 0;

    try {
        log.info("Démarrage FULL SYNC PostgreSQL -> Firebase");

        // 1. SUPPRIMER toutes les collections existantes
        deleteAllFirebaseCollections();
        
        // 2. RECRÉER toutes les collections
        int signalementsCount = syncAllSignalementsToFirebase();
        stats.put("signalements", signalementsCount);
        totalSynced += signalementsCount;

        int utilisateursCount = syncAllUtilisateursToFirebase();
        stats.put("utilisateurs", utilisateursCount);
        totalSynced += utilisateursCount;

        int etatsCount = syncAllEtatsSignalementToFirebase();
        stats.put("etat_signalement", etatsCount);
        totalSynced += etatsCount;

        int typesTravauxCount = syncAllTypesTravauxToFirebase();
        stats.put("type_travail", typesTravauxCount);
        totalSynced += typesTravauxCount;

        int typesUtilisateurCount = syncAllTypesUtilisateurToFirebase();
        stats.put("type_utilisateur", typesUtilisateurCount);
        totalSynced += typesUtilisateurCount;

        int entreprisesCount = syncAllEntreprisesToFirebase();
        stats.put("entreprise", entreprisesCount);
        totalSynced += entreprisesCount;

        int statutsCount = syncAllStatutsAssignationToFirebase();
        stats.put("statut_assignation", statutsCount);
        totalSynced += statutsCount;

        int entrepriseConcernerCount = syncAllEntreprisesConcernerToFirebase();
        stats.put("entreprise_concerner", entrepriseConcernerCount);
        totalSynced += entrepriseConcernerCount;

        int historiqueEtatCount = syncAllHistoriqueEtatToFirebase();
        stats.put("historique_etat_signalement", historiqueEtatCount);
        totalSynced += historiqueEtatCount;

        int historiqueStatutCount = syncAllHistoriqueStatutToFirebase();
        stats.put("historique_statut_assignation", historiqueStatutCount);
        totalSynced += historiqueStatutCount;

        // 3. Enregistrer la synchronisation réussie
        SynchronisationFirebase sync = new SynchronisationFirebase();
        sync.setDateSynchronisation(syncStartTime);
        sync.setSuccess(true);
        sync.setRemarque(String.format("FULL SYNC PostgreSQL->Firebase: %d documents", totalSynced));
        syncRepository.save(sync);

        log.info("FULL SYNC terminé: {} documents dans {} collections", totalSynced, stats.size());

        return new SyncResultDTO(
            true,
            syncStartTime,
            "Synchronisation complète vers Firebase réussie",
            stats,
            null
        );

    } catch (Exception e) {
        log.error("Erreur lors du FULL SYNC vers Firebase", e);

        // Enregistrer l'échec
        SynchronisationFirebase sync = new SynchronisationFirebase();
        sync.setDateSynchronisation(syncStartTime);
        sync.setSuccess(false);
        sync.setRemarque("Erreur FULL SYNC: " + e.getMessage());
        syncRepository.save(sync);

        return new SyncResultDTO(
            false,
            syncStartTime,
            "Échec de la synchronisation vers Firebase",
            stats,
            e.getMessage()
        );
    }
}

/**
 * Supprimer toutes les collections Firebase
 */
private void deleteAllFirebaseCollections() throws ExecutionException, InterruptedException {
    String[] collections = {
        "signalements", "utilisateurs", "etat_signalement", 
        "type_travail", "type_utilisateur", "entreprise", "statut_assignation",
        "entreprise_concerner", "historique_etat_signalement", "historique_statut_assignation"
    };

    for (String collectionName : collections) {
        deleteCollection(collectionName);
    }
    
    log.info("Toutes les collections Firebase ont été supprimées");
}

/**
 * Supprimer une collection Firebase
 */
private void deleteCollection(String collectionName) throws ExecutionException, InterruptedException {
    CollectionReference collection = firestore.collection(collectionName);
    ApiFuture<QuerySnapshot> future = collection.get();
    List<QueryDocumentSnapshot> documents = future.get().getDocuments();
 Historique

**Fichier**: `back_end/src/main/java/com/signalement/repository/HistoriqueEtatSignalementRepository.java`

Ajouter (si pas déjà présent):

```java
import org.springframework.data.repository.query.Param;

/**
 * Récupérer l'état le plus récent d'un signalement
 */
@Query("SELECT h FROM HistoriqueEtatSignalement h WHERE h.signalement = :signalement ORDER BY h.dateChangement DESC")
Optional<HistoriqueEtatSignalement> findLatestBySignalement(@Param("signalement") Signalement signalement);
```

> **Note**: Aucune méthode supplémentaire nécessaire dans SignalementRepository car on utilise `findAll()      data.put("latitude", signalement.getLatitude().doubleValue());
        data.put("longitude", signalement.getLongitude().doubleValue());
        data.put("surface_metre_carree", signalement.getSurfaceMetreCarree().doubleValue());
        data.put("date_creation", signalement.getDateCreation().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("url_photo", signalement.getUrlPhoto());
        data.put("last_update", signalement.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("id_type_travail", signalement.getTypeTravail().getIdTypeTravail());
        data.put("id_utilisateur", signalement.getUtilisateur().getIdUtilisateur());
        data.put("id_etat_signalement", etatActuelId);

        firestore.collection("signalements")
            .document(String.valueOf(signalement.getIdSignalement()))
            .set(data).get();
    }
    
    log.info("{} signalements synchronisés", signalements.size());
    return signalements.size();
}

/**
 * Synchroniser tous les utilisateurs vers Firebase
 */
private int syncAllUtilisateursToFirebase() throws ExecutionException, InterruptedException {
    List<Utilisateur> utilisateurs = utilisateurRepository.findAll();
    
    for (Utilisateur utilisateur : utilisateurs) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", utilisateur.getIdUtilisateur());
        data.put("nom", utilisateur.getNom());
        data.put("prenom", utilisateur.getPrenom());
        data.put("email", utilisateur.getEmail());
        data.put("is_blocked", utilisateur.getIsBlocked());
        data.put("id_type_utilisateur", utilisateur.getTypeUtilisateur().getIdTypeUtilisateur());
        data.put("last_update", utilisateur.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        firestore.collection("utilisateurs")
            .document(String.valueOf(utilisateur.getIdUtilisateur()))
            .set(data).get();
    }
    
    log.info("{} utilisateurs synchronisés", utilisateurs.size());
    return utilisateurs.size();
}

/**
 * Synchroniser tous les états de signalement vers Firebase
 */
private int syncAllEtatsSignalementToFirebase() throws ExecutionException, InterruptedException {
    List<EtatSignalement> etats = etatSignalementRepository.findAll();
    
    for (EtatSignalement etat : etats) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", etat.getIdEtatSignalement());
        data.put("libelle", etat.getLibelle());
        data.put("last_update", etat.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        firestore.collection("etat_signalement")
            .document(String.valueOf(etat.getIdEtatSignalement()))
            .set(data).get();
    }
    
    log.info("{} états de signalement synchronisés", etats.size());
    return etats.size();
}

/**
 * Synchroniser tous les types de travaux vers Firebase
 */
private int syncAllTypesTravauxToFirebase() throws ExecutionException, InterruptedException {
    List<TypeTravail> types = typeTravailRepository.findAll();
    
    for (TypeTravail type : types) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", type.getIdTypeTravail());
        data.put("libelle", type.getLibelle());
        data.put("last_update", type.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        firestore.collection("type_travail")
            .document(String.valueOf(type.getIdTypeTravail()))
            .set(data).get();
    }
    
    log.info("{} types de travaux synchronisés", types.size());
    return types.size();
}

/**
 * Synchroniser tous les types d'utilisateur vers Firebase
 */
private int syncAllTypesUtilisateurToFirebase() throws ExecutionException, InterruptedException {
    List<TypeUtilisateur> types = typeUtilisateurRepository.findAll();
    
    for (TypeUtilisateur type : types) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", type.getIdTypeUtilisateur());
        data.put("libelle", type.getLibelle());
        data.put("last_update", type.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        firestore.collection("type_utilisateur")
            .document(String.valueOf(type.getIdTypeUtilisateur()))
            .set(data).get();
    }
    
    log.info("{} types d'utilisateur synchronisés", types.size());
    return types.size();
}

/**
 * Synchroniser toutes les entreprises vers Firebase
 */
private int syncAllEntreprisesToFirebase() throws ExecutionException, InterruptedException {
    List<Entreprise> entreprises = entrepriseRepository.findAll();
    
    for (Entreprise entreprise : entreprises) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", entreprise.getIdEntreprise());
        data.put("nom_du_compagnie", entreprise.getNomDuCompagnie());
        data.put("email", entreprise.getEmail());
        data.put("last_update", entreprise.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        firestore.collection("entreprise")
            .document(String.valueOf(entreprise.getIdEntreprise()))
            .set(data).get();
    }
    
    log.info("{} entreprises synchronisées", entreprises.size());
    return entreprises.size();
}

/**
 * Synchroniser tous les statuts d'assignation vers Firebase
 */
private int syncAllStatutsAssignationToFirebase() throws ExecutionException, InterruptedException {
    List<StatutAssignation> statuts = statutAssignationRepository.findAll();
    
    for (StatutAssignation statut : statuts) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", statut.getIdStatutAssignation());
        data.put("libelle", statut.getLibelle());
        data.put("last_update", statut.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());

        firestore.collection("statut_assignation")
            .document(String.valueOf(statut.getIdStatutAssignation()))
            .set(data).get();
    }
    
    log.info("{} statuts d'assignation synchronisés", statuts.size());
    return statuts.size();
}

/**
 * Synchroniser toutes les entreprises concernées (assignations) vers Firebase
 */
private int syncAllEntreprisesConcernerToFirebase() throws ExecutionException, InterruptedException {
    List<EntrepriseConcerner> assignations = entrepriseConcernerRepository.findAll();
    
    for (EntrepriseConcerner ec : assignations) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", ec.getIdEntrepriseConcerner());
        data.put("date_creation", ec.getDateCreation() != null ? 
            ec.getDateCreation().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() : null);
        data.put("montant", ec.getMontant() != null ? ec.getMontant().doubleValue() : null);
        data.put("date_debut", ec.getDateDebut().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("date_fin", ec.getDateFin().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("last_update", ec.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("id_signalement", ec.getSignalement().getIdSignalement());
        data.put("id_entreprise", ec.getEntreprise().getIdEntreprise());
        data.put("id_statut_assignation", ec.getStatutAssignation() != null ? 
            ec.getStatutAssignation().getIdStatutAssignation() : null);

        firestore.collection("entreprise_concerner")
            .document(String.valueOf(ec.getIdEntrepriseConcerner()))
            .set(data).get();
    }
    
    log.info("{} entreprises concernées synchronisées", assignations.size());
    return assignations.size();
}

/**
 * Synchroniser tous les historiques d'état de signalement vers Firebase
 */
private int syncAllHistoriqueEtatToFirebase() throws ExecutionException, InterruptedException {
    List<HistoriqueEtatSignalement> historiques = historiqueEtatRepository.findAll();
    
    for (HistoriqueEtatSignalement h : historiques) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", h.getIdHistorique());
        data.put("date_changement", h.getDateChangement().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("last_update", h.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("id_signalement", h.getSignalement().getIdSignalement());
        data.put("id_etat_signalement", h.getEtatSignalement().getIdEtatSignalement());

        firestore.collection("historique_etat_signalement")
            .document(String.valueOf(h.getIdHistorique()))
            .set(data).get();
    }
    
    log.info("{} historiques d'état synchronisés", historiques.size());
    return historiques.size();
}

/**
 * Synchroniser tous les historiques de statut d'assignation vers Firebase
 */
private int syncAllHistoriqueStatutToFirebase() throws ExecutionException, InterruptedException {
    List<HistoriqueStatutAssignation> historiques = historiqueStatutRepository.findAll();
    
    for (HistoriqueStatutAssignation h : historiques) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", h.getIdHistorique());
        data.put("date_changement", h.getDateChangement().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("last_update", h.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        data.put("id_entreprise_concerner", h.getEntrepriseConcerner().getIdEntrepriseConcerner());
        data.put("id_statut_assignation", h.getStatutAssignation().getIdStatutAssignation());

        firestore.collection("historique_statut_assignation")
            .document(String.valueOf(h.getIdHistorique()))
            .set(data).get();
    }
    
    log.info("{} historiques de statut synchronisés", historiques.size());
    return historiques.size();
}
```

---

### ÉTAPE 2: Ajouter une Méthode au Repository

**Fichier**: `back_end/src/main/java/com/signalement/repository/SignalementRepository.java`

Ajouter:

```java
/**
 * Récupérer tous les signalements modifiés après une date donnée
 */
List<Signalement> findByLastUpdateAfter(LocalDateTime since);
```

**Fichier**: `back_end/src/main/java/com/signalement/repository/HistoriqueEtatSignalementRepository.java`

Ajouter:

```java
/**
 * Récupérer l'état le plus récent d'un signalement
 */
@Query("SELECT h FROM HistoriqueEtatSignalement h WHERE h.signalement = :signalement ORDER BY h.dateChangement DESC")
Optional<HistoriqueEtatSignalement> findLatestBySignalement(@Param("signalement") Signalement signalement);
```

---

### ÉTAPE 3: Ajouter l'Endpoint au Contrôleur

**Fichier**: `back_end/src/main/java/com/signalement/controller/SynchronisationController.java`

Ajouter:

```java
@Operation(
    summary = "Synchroniser vers Firebase (Tâche 32)",
    description = "Envoie les données modifiées depuis PostgreSQL vers Firebase. Réservé aux managers."
)
@ApiResponses(value = {
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "200", 
        description = "Synchronisation réussie"
    ),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "401", 
        description = "Non authentifié"
    ),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "403", 
        description = "Accès refusé"
    )
})
@PostMapping("/to-firebase")
public ResponseEntity<ApiResponse> syncToFirebase(
        @Parameter(hidden = true) HttpServletRequest httpRequest) {
    
    String auth = httpRequest.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ")) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiResponse(false, "Authentification requise"));
    }

    String token = auth.substring(7).trim();
    return sessionService.getUtilisateurByToken(token)
        .map(manager -> {
            // Vérifier que c'est un manager
            if (manager.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, "Seuls les managers peuvent lancer la synchronisation"));
            }

            // Lancer la synchronisation
            SyncResultDTO result = syncService.syncToFirebase();
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(
                    new ApiResponse(true, result.getMessage(), result));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, result.getMessage(), result));
            }
        })
        .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiResponse(false, "Token invalide")));
}

@Operation(
    summary = "Synchronisation bidirectionnelle complète",
    description = "Effectue une synchronisation complète: Firebase -> PostgreSQL puis PostgreSQL -> Firebase"
)
@PostMapping("/full")
public ResponseEntity<ApiResponse> fullSync(
        @Parameter(hidden = true) HttpServletRequest httpRequest) {
    
    String auth = httpRequest.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ")) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiResponse(false, "Authentification requise"));
    }

    String token = auth.substring(7).trim();
    return sessionService.getUtilisateurByToken(token)
        .map(manager -> {
            if (manager.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, "Seuls les managers peuvent lancer la synchronisation"));
            }

            // 1. Sync depuis Firebase
            SyncResultDTO fromFirebase = syncService.syncFromFirebase();
            
            // 2. Sync vers Firebase
            SyncResultDTO toFirebase = syncService.syncToFirebase();

            Map<String, Object> fullResult = new HashMap<>();
            fullResult.put("fromFirebase", fromFirebase);
            fullResult.put("toFirebase", toFirebase);
            fullResult.put("success", fromFirebase.isSuccess() && toFirebase.isSuccess());

            return ResponseEntity.ok(
                new ApiResponse(true, "Synchronisation bidirectionnelle terminée", fullResult));
        })
        .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiResponse(false, "Token invalide")));
}
```

---

### ÉTAPE 4: Tests HTTP

**Fichier**: `http/Test_Synchronisation_Tache_32.http`

```http
### ============================================================
### TÂCHE 32 - SYNCHRONISATION VERS FIREBASE
### ============================================================

### Configuration
@baseUrl = http://localhost:8080/api
@tokenManager = 0e9d9824-696e-4535-865e-321d05cf209e

### T32-1: Lancer la synchronisation vers Firebase (Manager)
POST {{baseUrl}}/sync/to-firebase
Authorization: Bearer {{tokenManager}}
Content-Type: application/json

###

### T32-2: Synchronisation bidirectionnelle complète
POST {{baseUrl}}/sync/full
Authorization: Bearer {{tokenManager}}
Content-Type: application/json

###

### T32-3: Créer un signalement local puis synchroniser
POST {{baseUrl}}/signalements
Authorization: Bearer {{tokenManager}}
Content-Type: application/json

{
  "titre": "Test sync vers Firebase",
  "description": "Ce signalement sera synchronisé vers Firebase",
  "latitude": 48.8588,
  "longitude": 2.3475,
  "type_route": "Boulevard",
  "gravite": "Moyenne",
  "type_signalement_id": 1
}

###

### T32-4: Lancer la sync vers Firebase
POST {{baseUrl}}/sync/to-firebase
Authorization: Bearer {{tokenManager}}
Content-Type: application/json

###
```

---

## 📊 STRUCTURE FIREBASE FIRESTORE

### Collection `signalements`

```
/signalements
  └─ signalement_{id}
      ├─ titre: string
      ├─ description: string
      ├─ latitude: number (Modifiable par mobile)

```
/signalements/{id}
  ├─ id: number
  ├─ titre: string
  ├─ description: string
  ├─ latitude: number
  ├─ longitude: number
  ├─ surface_metre_carree: number
  ├─ date_creation: timestamp (ms)
  ├─ url_photo: string
  ├─ last_update: timestamp (ms)
  ├─ id_type_travail: number
  ├─ id_utilisateur: number
  └─ id_etat_signalement: number
```

### Collection `utilisateurs` (Lecture seule)

```
/utilisateurs/{id}
  ├─ id: number
  ├─ nom: string
  ├─ prenom: string
  ├─ email: string
  ├─ is_blocked: boolean
  ├─ id_type_utilisateur: number
  └─ last_update: timestamp (ms)
```

### Collection `etat_signalement` (Lecture seule)

```
/etat_signalement/{id}
  ├─ id: number
  ├─ libelle: string
  └─ last_update: timestamp (ms)
```

### Collection `type_travail` (Lecture seule)

```
/type_travail/{id}
  ├─ id: number
  ├─ libelle: string
  └─ last_update: timestamp (ms)
```

### Collection `type_utilisateur` (Lecture seule)

```
/type_utilisateur/{id}
  ├─ id: number
  ├─ libelle: string
  └─ last_update: timestamp (ms)
```

### Collection `entreprise` (Lecture seule)

```
/entreprise/{id}
  ├─ id: number
  ├─ nom_du_compagnie: string
  ├─ email: string
  └─ last_update: timestamp (ms)
```

### Collection `statut_assignation` (Lecture seule)

```
/statut_assignation/{id}
  ├─ id: number
  ├─ libelle: string
  └─ last_update: timestamp (ms)
```

### Collection `entreprise_concerner` (Lecture seule)

```
/entreprise_concerner/{id}
  ├─ id: number
  ├─ date_creation: timestamp (ms)
  ├─ montant: number
  ├─ date_debut: timestamp (ms)
  ├─ date_fin: timestamp (ms)
  ├─ last_update: timestamp (ms)
  ├─ id_signalement: number
  ├─ id_entreprise: number
  └─ id_statut_assignation: number
```

### Collection `historique_etat_signalement` (Lecture seule)

```
/historique_etat_signalement/{id}
  ├─ id: number
  ├─ date_changement: timestamp (ms)
  ├─ last_update: timestamp (ms)
  ├─ id_signalement: number
  └─ id_etat_signalement: number
```

### Collection `historique_statut_assignation` (Lecture seule)

```
/historique_statut_assignation/{id}
  ├─ id: number
  ├─ date_changement: timestamp (ms)
  ├─ last_update: timestamp (ms)
  ├─ id_entreprise_concerner: number
  └─ id_statut_assignation: number
```

### 📋 Exemples de Documents

**Signalement**:
```json
{
  "id": 1,
  "titre": "Nid de poule Avenue de la République",
  "description": "Gros trou qui endommage les véhicules",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "surface_Sync depuis Firebase (Tâche 31)
- Firebase contient 5 nouveaux signalements créés par mobile
- Lancer `POST /api/sync/from-firebase`
- PostgreSQL doit contenir ces 5 signalements

#### SC-2: Mise à jour signalement mobile
- Signalement existe dans PostgreSQL
- Utilisateur mobile modifie le titre dans Firebase
- Lancer `POST /api/sync/from-firebase`
- PostgreSQL doit avoir le nouveau titre

#### SC-3: Full Sync vers Firebase (Tâche 32)
- PostgreSQL contient 100 signalements + données référentielles
- Firebase contient des anciennes données
- Lancer `POST /api/sync/to-firebase`
- Firebase doit contenir EXACTEMENT les mêmes données que PostgreSQL
- Toutes les anciennes données Firebase doivent être supprimées

#### SC-4: Sync bidirectionnelle
- Mobile crée signalement A dans Firebase
- Manager crée signalement B dans PostgreSQL
- Lancer `POST /api/sync/from-firebase` → A importé dans PostgreSQL
- Lancer `POST /api/sync/to-firebase` → A et B exportés vers Firebase
- Firebase doit contenir A et B + toutes les données référentielles
1. **Last-Write-Wins**: Utiliser `last_update` pour déterminer quelle version est la plus récente
2. **Marqueur de source**: Ajouter un champ `source` ('firebase' ou 'postgresql')
3. **Résolution manuelle**: Marquer les conflits pour revue manager

### Contraintes Relationnelles
- Les IDs `id_type_travail`, `id_utilisateur` doivent exister dans PostgreSQL
- Lors de la sync depuis Firebase, vérifier l'existence des entités liées

### Performance
- Pour 1000+ signalements, implémenter une pagination
- Utiliser des batch writes Firebase (max 500 operations)

### Sécurité
- Le fichier `firebase-service-account.json` contient des credentials sensibles
- Ne JAMAIS le commit dans Git
- Ajouter à `.gitignore`:
  ```
  **/firebase-service-account.json
  ```
(FULL SYNC) ajoutée au service
- [ ] Méthode `deleteAllFirebaseCollections()` implémentée
- [ ] Méthodes `syncAll*ToFirebase()` pour chaque collection
- [ ] Méthode `findLatestBySignalement()` ajoutée au repository historique
- [ ] Endpoint `POST /api/sync/to-firebase` créé
- [ ] Endpoint `POST /api/sync/full` créé
- [ ] Tests HTTP créés
- [ ] Tests manuels effectués (vérifier que TOUTES les collections sont recréées)
1. **Créer des données dans Firebase**:
   - Via Firebase Console ou l'app mobile
   - Lancer `POST /api/sync/from-firebase`
   - Vérifier dans PostgreSQL

2. **Créer des données dans PostgreSQL**:
   - Via l'API REST `POST /api/signalements`
   - Lancer `POST /api/sync/to-firebase`
   - Vérifier dans Firebase Console

3. **Test bidirectionnel**:
   - Créer signalement A dans Firebase
   - Créer signalement B dans PostgreSQL
   - Lancer `POST /api/sync/full`
   - Vérifier que A et B existent dans les deux systèmes

### Scénarios de Test

#### SC-1: Première synchronisation
- BDD PostgreSQL vide
- Firebase contient 5 signalements
- Après sync: PostgreSQL contient 5 signalements

#### SC-2: Mise à jour
- Signalement existe dans les deux
- Modifier le titre dans Firebase
- Sync depuis Firebase
- PostgreSQL doit avoir le nouveau titre

#### SC-3: Nouveau signalement offline
- Créer signalement en mode offline (PostgreSQL)
- Sync vers Firebase
- Firebase doit contenir le nouveau signalement

#### SC-4: Conflit
- last_update PostgreSQL: 2026-01-22 10:00
- last_update Firebase: 2026-01-22 11:00
- Firebase gagne (version plus récente)

---

## 📝 CHECKLIST DE COMPLETION

### Tâche 31
- [ ] Entité `SynchronisationFirebase` créée
- [ ] Repository `SynchronisationFirebaseRepository` créé
- [ ] Dépendance Firebase Admin SDK ajoutée au pom.xml
- [ ] Configuration Firebase (`FirebaseConfig.java`)
- [ ] Fichier `firebase-service-account.json` obtenu et placé
- [ ] DTOs créés (`SyncResultDTO`, `FirebaseSignalementDTO`)
- [ ] Service `FirebaseSyncService.syncFromFirebase()` implémenté
- [ ] Méthode `findByLatitudeAndLongitudeAndTitre()` ajoutée au repository
- [ ] Contrôleur `SynchronisationController` créé
- [ ] Endpoint `POST /api/sync/from-firebase` testé
- [ ] Documentation Swagger générée

### Tâche 32
- [ ] Méthode `syncToFirebase()` ajoutée au service
- [ ] Méthode `findByLastUpdateAfter()` ajoutée au repository
- [ ] Méthode `findLatestBySignalement()` ajoutée au repository historique
- [ ] Endpoint `POST /api/sync/to-firebase` créé
- [ ] Endpoint `POST /api/sync/full` créé
- [ ] Tests HTTP créés
- [ ] Tests manuels effectués

### Documentation
- [ ] Guide d'utilisation pour les managers
- [ ] Structure Firestore documentée
- [ ] Fichier `.gitignore` mis à jour
- [ ] README mis à jour

---

## 📚 RESSOURCES

### Documentation Firebase
- Admin SDK: https://firebase.google.com/docs/admin/setup
- Firestore: https://firebase.google.com/docs/firestore

### Tutoriels
- Spring Boot + Firebase: https://www.baeldung.com/spring-boot-firebase
- Firestore Java SDK: https://googleapis.dev/java/google-cloud-firestore/latest/

---

**FIN DU GUIDE**
