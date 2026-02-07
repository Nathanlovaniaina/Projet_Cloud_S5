package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.PhotoSignalement;
import com.signalement.entity.Signalement;
import com.signalement.repository.PhotoSignalementRepository;
import com.signalement.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoSignalementService {

    private final PhotoSignalementRepository photoSignalementRepository;
    private final SignalementRepository signalementRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    /**
     * Synchroniser les photos depuis Firebase (Tâche 31)
     * Récupère les photos modifiées après la date lastSyncDate et les met à jour en BD
     */
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("photo_signalement");
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
                var existing = photoSignalementRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    PhotoSignalement photo = existing.orElse(new PhotoSignalement());
                    photo.setIdPhotoSignalement(id);
                    photo.setUrlPhoto(doc.getString("url_photo"));
                    
                    // Récupérer la date d'ajout depuis Firebase (en millisecondes)
                    Long dateAjoutMs = firebaseConversionService.getLongValue(doc, "date_ajout");
                    if (dateAjoutMs != null) {
                        LocalDate dateAjout = LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateAjoutMs), ZoneId.systemDefault()).toLocalDate();
                        photo.setDateAjout(dateAjout);
                    }
                    
                    // Récupérer le signalement associé
                    Integer signalementId = firebaseConversionService.getLongAsInteger(doc, "id_signalement");
                    if (signalementId != null) {
                        Signalement signalement = signalementRepository.findById(signalementId).orElse(null);
                        if (signalement != null) {
                            photo.setSignalement(signalement);
                            photo.setLastUpdate(firebaseLastUpdate);
                            photoSignalementRepository.save(photo);
                            synced++;
                        }
                    }
                }
            }
        }
        log.info("{} photos synchronisées depuis Firebase", synced);
        return synced;
    }

    /**
     * Synchroniser toutes les photos vers Firebase (Tâche 32)
     * Envoie toutes les photos de la BD vers Firebase
     */
    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<PhotoSignalement> photos = photoSignalementRepository.findAll();
        for (PhotoSignalement photo : photos) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", photo.getIdPhotoSignalement());
            data.put("url_photo", photo.getUrlPhoto());
            
            if (photo.getDateAjout() != null) {
                data.put("date_ajout", photo.getDateAjout().atStartOfDay()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("last_update", photo.getLastUpdate()
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            
            if (photo.getSignalement() != null) {
                data.put("id_signalement", photo.getSignalement().getIdSignalement());
            }
            
            firestore.collection("photo_signalement")
                .document(String.valueOf(photo.getIdPhotoSignalement()))
                .set(data).get();
        }
        log.info("{} photos recréées dans Firebase", photos.size());
        return photos.size();
    }
}
