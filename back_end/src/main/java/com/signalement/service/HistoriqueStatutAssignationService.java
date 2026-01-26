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
public class HistoriqueStatutAssignationService {

    private final HistoriqueStatutAssignationRepository historiqueRepository;
    private final EntrepriseConcernerRepository entrepriseConcernerRepository;
    private final StatutAssignationRepository statutRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("historique_statut_assignation");
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
                    HistoriqueStatutAssignation historique = existing.orElse(new HistoriqueStatutAssignation());
                    historique.setIdHistorique(id);
                    
                    Long dateChangementMs = firebaseConversionService.getLongValue(doc, "date_changement");
                    if (dateChangementMs != null) {
                        historique.setDateChangement(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateChangementMs), ZoneId.systemDefault()));
                    }
                    
                    Integer entrepriseConcernerId = firebaseConversionService.getLongAsInteger(doc, "id_entreprise_concerner");
                    EntrepriseConcerner ec = entrepriseConcernerRepository.findById(entrepriseConcernerId).orElse(null);
                    
                    Integer statutId = firebaseConversionService.getLongAsInteger(doc, "id_statut");
                    StatutAssignation statut = statutRepository.findById(statutId).orElse(null);
                    
                    if (ec != null && statut != null) {
                        historique.setEntrepriseConcerner(ec);
                        historique.setStatutAssignation(statut);
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
        List<HistoriqueStatutAssignation> historiques = historiqueRepository.findAll();
        for (HistoriqueStatutAssignation historique : historiques) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", historique.getIdHistorique());
            
            if (historique.getDateChangement() != null) {
                data.put("date_changement", historique.getDateChangement()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("last_update", historique.getLastUpdate()
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            data.put("id_entreprise_concerner", historique.getEntrepriseConcerner().getIdEntrepriseConcerner());
            data.put("id_statut", historique.getStatutAssignation().getIdStatutAssignation());
            
            firestore.collection("historique_statut_assignation")
                .document(String.valueOf(historique.getIdHistorique()))
                .set(data).get();
        }
        log.info("{} historiques de statut recréés", historiques.size());
        return historiques.size();
    }
}
