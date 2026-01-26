package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.TypeUtilisateur;
import com.signalement.repository.TypeUtilisateurRepository;
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
public class TypeUtilisateurService {

    private final TypeUtilisateurRepository typeUtilisateurRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    /**
     * Synchroniser les types d'utilisateur depuis Firebase (Tâche 31)
     */
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("type_utilisateur");
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
                var existing = typeUtilisateurRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    TypeUtilisateur type = existing.orElse(new TypeUtilisateur());
                    type.setIdTypeUtilisateur(id);
                    type.setLibelle(doc.getString("libelle"));
                    typeUtilisateurRepository.save(type);
                    synced++;
                }
            }
        }
        return synced;
    }

    /**
     * Synchroniser tous les types d'utilisateur vers Firebase (Tâche 32)
     */
    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
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
        log.info("{} types d'utilisateur recréés", types.size());
        return types.size();
    }
}
