package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.Entreprise;
import com.signalement.repository.EntrepriseRepository;
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
public class EntrepriseService {

    private final EntrepriseRepository entrepriseRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    @Transactional(readOnly = true)
    public List<Entreprise> getAllEntreprises() {
        return entrepriseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Entreprise> getEntrepriseById(Integer id) {
        return entrepriseRepository.findById(id);
    }

    @Transactional
    public Entreprise createEntreprise(Entreprise entreprise) {
        return entrepriseRepository.save(entreprise);
    }

    @Transactional
    public void deleteEntreprise(Integer id) {
        entrepriseRepository.deleteById(id);
    }

    // ======== FIREBASE SYNC METHODS (Tâches 31 & 32) ========
    
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("entreprises");
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
                var existing = entrepriseRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    Entreprise entreprise = existing.orElse(new Entreprise());
                    entreprise.setIdEntreprise(id);
                    entreprise.setNomDuCompagnie(doc.getString("nom"));
                    entreprise.setEmail(doc.getString("email"));
                    entrepriseRepository.save(entreprise);
                    synced++;
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<Entreprise> entreprises = entrepriseRepository.findAll();
        for (Entreprise entreprise : entreprises) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", entreprise.getIdEntreprise());
            data.put("nom", entreprise.getNomDuCompagnie());
            data.put("email", entreprise.getEmail());
            data.put("last_update", entreprise.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            
            firestore.collection("entreprises")
                .document(String.valueOf(entreprise.getIdEntreprise()))
                .set(data).get();
        }
        log.info("{} entreprises recréées", entreprises.size());
        return entreprises.size();
    }
}
