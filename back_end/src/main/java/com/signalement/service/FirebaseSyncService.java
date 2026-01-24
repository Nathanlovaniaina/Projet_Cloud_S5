package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.dto.SyncResultDTO;
import com.signalement.entity.SynchronisationFirebase;
import com.signalement.repository.SynchronisationFirebaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseSyncService {

    private final Firestore firestore;
    private final SynchronisationFirebaseRepository syncRepository;
    
    // Injection des services pour chaque entité
    private final UtilisateurService utilisateurService;
    private final SignalementService signalementService;
    private final EntrepriseService entrepriseService;
    private final TypeTravailService typeTravailService;
    private final TypeUtilisateurService typeUtilisateurService;
    private final EtatSignalementService etatSignalementService;
    private final StatutAssignationService statutAssignationService;
    private final EntrepriseConcernerService entrepriseConcernerService;
    private final HistoriqueEtatSignalementService historiqueEtatService;
    private final HistoriqueStatutAssignationService historiqueStatutService;
    private final SessionService sessionService;
    private final TentativeConnexionService tentativeConnexionService;

    /**
     * TÂCHE 31: Synchroniser depuis Firebase vers PostgreSQL
     * TOUTES les tables avec gestion de conflits (Last-Write-Wins)
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

            // 2. Synchroniser TOUTES les tables via les services
            int utilisateursSynced = utilisateurService.syncFromFirebase(lastSyncDate);
            stats.put("utilisateurs", utilisateursSynced);
            totalSynced += utilisateursSynced;

            int typesUtilisateurSynced = typeUtilisateurService.syncFromFirebase(lastSyncDate);
            stats.put("type_utilisateur", typesUtilisateurSynced);
            totalSynced += typesUtilisateurSynced;

            int etatsSynced = etatSignalementService.syncFromFirebase(lastSyncDate);
            stats.put("etat_signalement", etatsSynced);
            totalSynced += etatsSynced;

            int typesTravauxSynced = typeTravailService.syncFromFirebase(lastSyncDate);
            stats.put("type_travail", typesTravauxSynced);
            totalSynced += typesTravauxSynced;

            int entreprisesSynced = entrepriseService.syncFromFirebase(lastSyncDate);
            stats.put("entreprise", entreprisesSynced);
            totalSynced += entreprisesSynced;

            int statutsSynced = statutAssignationService.syncFromFirebase(lastSyncDate);
            stats.put("statut_assignation", statutsSynced);
            totalSynced += statutsSynced;

            int signalementsSynced = signalementService.syncFromFirebase(lastSyncDate);
            stats.put("signalements", signalementsSynced);
            totalSynced += signalementsSynced;

            int entrepriseConcernerSynced = entrepriseConcernerService.syncFromFirebase(lastSyncDate);
            stats.put("entreprise_concerner", entrepriseConcernerSynced);
            totalSynced += entrepriseConcernerSynced;

            int historiqueEtatSynced = historiqueEtatService.syncFromFirebase(lastSyncDate);
            stats.put("historique_etat_signalement", historiqueEtatSynced);
            totalSynced += historiqueEtatSynced;

            int historiqueStatutSynced = historiqueStatutService.syncFromFirebase(lastSyncDate);
            stats.put("historique_statut_assignation", historiqueStatutSynced);
            totalSynced += historiqueStatutSynced;

            int sessionsSynced = sessionService.syncFromFirebase(lastSyncDate);
            stats.put("session", sessionsSynced);
            totalSynced += sessionsSynced;

            int tentativesConnexionSynced = tentativeConnexionService.syncFromFirebase(lastSyncDate);
            stats.put("tentative_connexion", tentativesConnexionSynced);
            totalSynced += tentativesConnexionSynced;

            // 3. Enregistrer la synchronisation réussie
            SynchronisationFirebase sync = new SynchronisationFirebase();
            sync.setDateSynchronisation(syncStartTime);
            sync.setSuccess(true);
            sync.setRemarque(String.format("Sync Firebase->PostgreSQL: %d enregistrements dans %d tables", totalSynced, stats.size()));
            syncRepository.save(sync);

            log.info("Synchronisation terminée avec succès: {} enregistrements", totalSynced);

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
                "Erreur lors de la synchronisation",
                stats,
                e.getMessage()
            );
        }
    }

    /**
     * TÂCHE 32: Synchroniser depuis PostgreSQL vers Firebase
     * FULL SYNC: Supprime tout Firebase et recrée avec PostgreSQL
     */
    @Transactional
    public SyncResultDTO syncToFirebase() {
        LocalDateTime syncStartTime = LocalDateTime.now();
        Map<String, Integer> stats = new HashMap<>();
        int totalSynced = 0;

        try {
            log.info("Démarrage FULL SYNC PostgreSQL -> Firebase");

            // 1. SUPPRIMER toutes les collections Firebase
            deleteAllFirebaseCollections();

            // 2. RECRÉER toutes les collections avec les données PostgreSQL via les services
            int typesUtilisateurCount = typeUtilisateurService.syncAllToFirebase();
            stats.put("type_utilisateur", typesUtilisateurCount);
            totalSynced += typesUtilisateurCount;

            int utilisateursCount = utilisateurService.syncAllToFirebase();
            stats.put("utilisateurs", utilisateursCount);
            totalSynced += utilisateursCount;

            int etatsCount = etatSignalementService.syncAllToFirebase();
            stats.put("etat_signalement", etatsCount);
            totalSynced += etatsCount;

            int typesTravauxCount = typeTravailService.syncAllToFirebase();
            stats.put("type_travail", typesTravauxCount);
            totalSynced += typesTravauxCount;

            int entreprisesCount = entrepriseService.syncAllToFirebase();
            stats.put("entreprise", entreprisesCount);
            totalSynced += entreprisesCount;

            int statutsCount = statutAssignationService.syncAllToFirebase();
            stats.put("statut_assignation", statutsCount);
            totalSynced += statutsCount;

            int signalementsCount = signalementService.syncAllToFirebase();
            stats.put("signalements", signalementsCount);
            totalSynced += signalementsCount;

            int entrepriseConcernerCount = entrepriseConcernerService.syncAllToFirebase();
            stats.put("entreprise_concerner", entrepriseConcernerCount);
            totalSynced += entrepriseConcernerCount;

            int historiqueEtatCount = historiqueEtatService.syncAllToFirebase();
            stats.put("historique_etat_signalement", historiqueEtatCount);
            totalSynced += historiqueEtatCount;

            int historiqueStatutCount = historiqueStatutService.syncAllToFirebase();
            stats.put("historique_statut_assignation", historiqueStatutCount);
            totalSynced += historiqueStatutCount;

            int sessionsCount = sessionService.syncAllToFirebase();
            stats.put("session", sessionsCount);
            totalSynced += sessionsCount;

            int tentativesConnexionCount = tentativeConnexionService.syncAllToFirebase();
            stats.put("tentative_connexion", tentativesConnexionCount);
            totalSynced += tentativesConnexionCount;

            // 3. Enregistrer la synchronisation réussie
            SynchronisationFirebase sync = new SynchronisationFirebase();
            sync.setDateSynchronisation(syncStartTime);
            sync.setSuccess(true);
            sync.setRemarque(String.format("FULL SYNC PostgreSQL->Firebase: %d documents dans %d collections", totalSynced, stats.size()));
            syncRepository.save(sync);

            log.info("FULL SYNC terminé: {} documents dans {} collections", totalSynced, stats.size());

            return new SyncResultDTO(
                true,
                syncStartTime,
                "FULL SYNC réussi vers Firebase",
                stats,
                null
            );

        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation vers Firebase", e);

            // Enregistrer l'échec
            SynchronisationFirebase sync = new SynchronisationFirebase();
            sync.setDateSynchronisation(syncStartTime);
            sync.setSuccess(false);
            sync.setRemarque("Erreur PostgreSQL->Firebase: " + e.getMessage());
            syncRepository.save(sync);

            return new SyncResultDTO(
                false,
                syncStartTime,
                "Erreur lors du FULL SYNC",
                stats,
                e.getMessage()
            );
        }
    }

    // ============================================================
    // MÉTHODES UTILITAIRES - Suppression Firebase
    // ============================================================

    /**
     * Supprimer toutes les collections Firebase
     */
    private void deleteAllFirebaseCollections() throws ExecutionException, InterruptedException {
        String[] collections = {
            "signalements", "utilisateurs", "etat_signalement", 
            "type_travail", "type_utilisateur", "entreprise", "statut_assignation",
            "entreprise_concerner", "historique_etat_signalement", "historique_statut_assignation",
            "session", "tentative_connexion"
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
        java.util.List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        for (QueryDocumentSnapshot document : documents) {
            document.getReference().delete().get();
        }
        
        log.info("Collection {} supprimée ({} documents)", collectionName, documents.size());
    }
}
