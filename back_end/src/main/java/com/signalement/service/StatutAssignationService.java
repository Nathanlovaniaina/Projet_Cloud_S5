package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.StatutAssignation;
import com.signalement.repository.StatutAssignationRepository;
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
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatutAssignationService {

    private final StatutAssignationRepository statutAssignationRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    /**
     * Synchroniser les statuts d'assignation depuis Firebase (Tâche 31)
     */
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("statut_assignation");
        ApiFuture<QuerySnapshot> future = collection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        int synced = 0;
        for (QueryDocumentSnapshot doc : documents) {
            Long lastUpdateMs = doc.getLong("last_update");
            if (lastUpdateMs == null) continue;

            LocalDateTime firebaseLastUpdate = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(lastUpdateMs), ZoneId.systemDefault());

            if (firebaseLastUpdate.isAfter(lastSyncDate)) {
                Integer id = firebaseConversionService.getLongAsInteger(doc, "id");
                var existing = statutAssignationRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    StatutAssignation statut = existing.orElse(new StatutAssignation());
                    statut.setIdStatutAssignation(id);
                    statut.setLibelle(doc.getString("libelle"));
                    statutAssignationRepository.save(statut);
                    synced++;
                }
            }
        }
        return synced;
    }

    /**
     * Synchroniser tous les statuts d'assignation vers Firebase (Tâche 32)
     */
    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
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
        log.info("{} statuts d'assignation recréés", statuts.size());
        return statuts.size();
    }
}
