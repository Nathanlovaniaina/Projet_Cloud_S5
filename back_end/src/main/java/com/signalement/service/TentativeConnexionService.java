package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.*;
import com.signalement.repository.*;
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
public class TentativeConnexionService {

    private final TentativeConnexionRepository tentativeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final Firestore firestore;

    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("tentative_connexion");
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
                var existing = tentativeRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    TentativeConnexion tentative = existing.orElse(new TentativeConnexion());
                    tentative.setIdTentative(id);
                    
                    Long dateTentativeMs = doc.getLong("date_tentative");
                    if (dateTentativeMs != null) {
                        tentative.setDateTentative(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateTentativeMs), ZoneId.systemDefault()));
                    }
                    
                    Boolean success = doc.getBoolean("success");
                    if (success != null) {
                        tentative.setSuccess(success);
                    }
                    
                    Integer utilisateurId = doc.getLong("id_utilisateur").intValue();
                    Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
                    
                    if (utilisateur != null) {
                        tentative.setUtilisateur(utilisateur);
                        tentativeRepository.save(tentative);
                        synced++;
                    }
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<TentativeConnexion> tentatives = tentativeRepository.findAll();
        for (TentativeConnexion tentative : tentatives) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", tentative.getIdTentative());
            
            if (tentative.getDateTentative() != null) {
                data.put("date_tentative", tentative.getDateTentative()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("success", tentative.getSuccess());
            data.put("last_update", tentative.getLastUpdate()
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            data.put("id_utilisateur", tentative.getUtilisateur().getIdUtilisateur());
            
            firestore.collection("tentative_connexion")
                .document(String.valueOf(tentative.getIdTentative()))
                .set(data).get();
        }
        log.info("{} tentatives de connexion recréées", tentatives.size());
        return tentatives.size();
    }
}
