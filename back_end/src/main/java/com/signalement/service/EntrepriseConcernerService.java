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
public class EntrepriseConcernerService {

    private final EntrepriseConcernerRepository entrepriseConcernerRepository;
    private final SignalementRepository signalementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final StatutAssignationRepository statutAssignationRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("entreprise_concerner");
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
                var existing = entrepriseConcernerRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    EntrepriseConcerner ec = existing.orElse(new EntrepriseConcerner());
                    ec.setIdEntrepriseConcerner(id);
                    
                    Long dateCreationMs = firebaseConversionService.getLongValue(doc, "date_creation");
                    if (dateCreationMs != null) {
                        ec.setDateCreation(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateCreationMs), ZoneId.systemDefault()).toLocalDate());
                    }
                    
                    Double montant = doc.getDouble("montant");
                    if (montant != null) {
                        ec.setMontant(java.math.BigDecimal.valueOf(montant));
                    }
                    
                    Long dateDebutMs = firebaseConversionService.getLongValue(doc, "date_debut");
                    if (dateDebutMs != null) {
                        ec.setDateDebut(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateDebutMs), ZoneId.systemDefault()).toLocalDate());
                    }
                    
                    Long dateFinMs = firebaseConversionService.getLongValue(doc, "date_fin");
                    if (dateFinMs != null) {
                        ec.setDateFin(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateFinMs), ZoneId.systemDefault()).toLocalDate());
                    }
                    
                    Integer signalementId = firebaseConversionService.getLongAsInteger(doc, "id_signalement");
                    Signalement signalement = signalementRepository.findById(signalementId).orElse(null);
                    
                    Integer entrepriseId = firebaseConversionService.getLongAsInteger(doc, "id_entreprise");
                    Entreprise entreprise = entrepriseRepository.findById(entrepriseId).orElse(null);
                    
                    Long statutId = firebaseConversionService.getLongValue(doc, "id_statut_assignation");
                    StatutAssignation statut = null;
                    if (statutId != null) {
                        statut = statutAssignationRepository.findById(statutId.intValue()).orElse(null);
                    }
                    
                    if (signalement != null && entreprise != null) {
                        ec.setSignalement(signalement);
                        ec.setEntreprise(entreprise);
                        ec.setStatutAssignation(statut);
                        entrepriseConcernerRepository.save(ec);
                        synced++;
                    }
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<EntrepriseConcerner> entreprisesConcerner = entrepriseConcernerRepository.findAll();
        for (EntrepriseConcerner ec : entreprisesConcerner) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", ec.getIdEntrepriseConcerner());
            
            if (ec.getDateCreation() != null) {
                data.put("date_creation", ec.getDateCreation().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            if (ec.getMontant() != null) {
                data.put("montant", ec.getMontant().doubleValue());
            }
            
            if (ec.getDateDebut() != null) {
                data.put("date_debut", ec.getDateDebut().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            if (ec.getDateFin() != null) {
                data.put("date_fin", ec.getDateFin().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("last_update", ec.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            data.put("id_signalement", ec.getSignalement().getIdSignalement());
            data.put("id_entreprise", ec.getEntreprise().getIdEntreprise());
            
            if (ec.getStatutAssignation() != null) {
                data.put("id_statut_assignation", ec.getStatutAssignation().getIdStatutAssignation());
            }
            
            firestore.collection("entreprise_concerner")
                .document(String.valueOf(ec.getIdEntrepriseConcerner()))
                .set(data).get();
        }
        log.info("{} entreprises concernées recréées", entreprisesConcerner.size());
        return entreprisesConcerner.size();
    }
}
