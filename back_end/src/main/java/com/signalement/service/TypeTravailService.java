package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.TypeTravail;
import com.signalement.repository.TypeTravailRepository;
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
public class TypeTravailService {

    private final TypeTravailRepository typeTravailRepository;
    private final Firestore firestore;

    /**
     * Synchroniser les types de travail depuis Firebase (Tâche 31)
     */
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("type_travail");
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
                var existing = typeTravailRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    TypeTravail type = existing.orElse(new TypeTravail());
                    type.setIdTypeTravail(id);
                    type.setLibelle(doc.getString("libelle"));
                    typeTravailRepository.save(type);
                    synced++;
                }
            }
        }
        return synced;
    }

    /**
     * Synchroniser tous les types de travail vers Firebase (Tâche 32)
     */
    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
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
        log.info("{} types de travail recréés", types.size());
        return types.size();
    }
}
