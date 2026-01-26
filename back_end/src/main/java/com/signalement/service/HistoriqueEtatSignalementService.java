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
public class HistoriqueEtatSignalementService {

    private final HistoriqueEtatSignalementRepository historiqueRepository;
    private final SignalementRepository signalementRepository;
    private final EtatSignalementRepository etatRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("historique_etat_signalement");
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
                var existing = historiqueRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    HistoriqueEtatSignalement historique = existing.orElse(new HistoriqueEtatSignalement());
                    historique.setIdHistorique(id);
                    
                    Long dateChangementMs = firebaseConversionService.getLongValue(doc, "date_changement");
                    if (dateChangementMs != null) {
                        historique.setDateChangement(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateChangementMs), ZoneId.systemDefault()));
                    }
                    
                    Integer signalementId = firebaseConversionService.getLongAsInteger(doc, "id_signalement");
                    Signalement signalement = signalementRepository.findById(signalementId).orElse(null);
                    
                    Integer etatId = firebaseConversionService.getLongAsInteger(doc, "id_etat");
                    EtatSignalement etat = etatRepository.findById(etatId).orElse(null);
                    
                    if (signalement != null && etat != null) {
                        historique.setSignalement(signalement);
                        historique.setEtatSignalement(etat);
                        historiqueRepository.save(historique);
                        synced++;
                    }
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<HistoriqueEtatSignalement> historiques = historiqueRepository.findAll();
        for (HistoriqueEtatSignalement historique : historiques) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", historique.getIdHistorique());
            
            if (historique.getDateChangement() != null) {
                data.put("date_changement", historique.getDateChangement()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("last_update", historique.getLastUpdate()
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            data.put("id_signalement", historique.getSignalement().getIdSignalement());
            data.put("id_etat", historique.getEtatSignalement().getIdEtatSignalement());
            
            firestore.collection("historique_etat_signalement")
                .document(String.valueOf(historique.getIdHistorique()))
                .set(data).get();
        }
        log.info("{} historiques d'état recréés", historiques.size());
        return historiques.size();
    }
}
