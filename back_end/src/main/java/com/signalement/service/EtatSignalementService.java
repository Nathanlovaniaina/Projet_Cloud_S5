package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.EtatSignalement;
import com.signalement.repository.EtatSignalementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EtatSignalementService {

    private final EtatSignalementRepository etatSignalementRepository;
    private final Firestore firestore;

    @Transactional(readOnly = true)
    public List<EtatSignalement> getAllEtats() {
        return etatSignalementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<EtatSignalement> getEtatById(Integer id) {
        return etatSignalementRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<EtatSignalement> getEtatByLibelle(String libelle) {
        return etatSignalementRepository.findByLibelle(libelle);
    }

    // ======== FIREBASE SYNC METHODS (Tâches 31 & 32) ========
    
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("etat_signalement");
        ApiFuture<QuerySnapshot> future = collection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        int synced = 0;
        for (QueryDocumentSnapshot doc : documents) {
            Long lastUpdateMs = doc.getLong("last_update");
            if (lastUpdateMs == null) continue;

            LocalDateTime firebaseLastUpdate = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(lastUpdateMs), ZoneId.systemDefault());

            if (firebaseLastUpdate.isAfter(lastSyncDate)) {
                Integer id = doc.getLong("id").intValue();
                var existing = etatSignalementRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    EtatSignalement etat = existing.orElse(new EtatSignalement());
                    etat.setIdEtatSignalement(id);
                    etat.setLibelle(doc.getString("libelle"));
                    etatSignalementRepository.save(etat);
                    synced++;
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
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
        log.info("{} états de signalement recréés", etats.size());
        return etats.size();
    }
}
