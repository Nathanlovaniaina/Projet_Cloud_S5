package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.Utilisateur;
import com.signalement.entity.UtilisateurFcmTokens;
import com.signalement.repository.UtilisateurFcmTokensRepository;
import com.signalement.repository.UtilisateurRepository;
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
public class UtilisateurFcmTokensService {

    private final UtilisateurFcmTokensRepository utilisateurFcmTokensRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    /**
     * Synchroniser les tokens FCM depuis Firebase (Tâche 31)
     * Récupère les tokens modifiés après la date lastSyncDate et les met à jour en BD
     */
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("utilisateur_fcm_tokens");
        ApiFuture<QuerySnapshot> future = collection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        int synced = 0;
        for (QueryDocumentSnapshot doc : documents) {
            Long lastUpdateMs = doc.getLong("last_update");
            if (lastUpdateMs == null) continue;

            LocalDateTime firebaseLastUpdate = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(lastUpdateMs), ZoneId.systemDefault());

            if (firebaseLastUpdate.isAfter(lastSyncDate)) {
                String fcmToken = doc.getString("fcm_token");
                var existing = utilisateurFcmTokensRepository.findByFcmToken(fcmToken);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    UtilisateurFcmTokens token = existing.orElse(new UtilisateurFcmTokens());
                    token.setFcmToken(fcmToken);
                    token.setDeviceName(doc.getString("device_name"));
                    
                    // Récupérer la date de création depuis Firebase (en millisecondes)
                    Long dateCreationMs = firebaseConversionService.getLongValue(doc, "date_creation");
                    if (dateCreationMs != null) {
                        LocalDate dateCreation = LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateCreationMs), ZoneId.systemDefault()).toLocalDate();
                        token.setDateCreation(dateCreation);
                    }
                    
                    // Récupérer le champ enable
                    Boolean enable = (Boolean) doc.get("enable");
                    token.setEnable(enable != null ? enable : true);
                    
                    // Récupérer l'utilisateur associé
                    Integer utilisateurId = firebaseConversionService.getLongAsInteger(doc, "id_utilisateur");
                    if (utilisateurId != null) {
                        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
                        if (utilisateur != null) {
                            token.setUtilisateur(utilisateur);
                            token.setLastUpdate(firebaseLastUpdate);
                            utilisateurFcmTokensRepository.save(token);
                            synced++;
                        }
                    }
                }
            }
        }
        log.info("{} tokens FCM synchronisés depuis Firebase", synced);
        return synced;
    }

    /**
     * Synchroniser tous les tokens FCM vers Firebase (Tâche 32)
     * Envoie tous les tokens de la BD vers Firebase
     */
    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<UtilisateurFcmTokens> tokens = utilisateurFcmTokensRepository.findAll();
        for (UtilisateurFcmTokens token : tokens) {
            Map<String, Object> data = new HashMap<>();
            data.put("fcm_token", token.getFcmToken());
            data.put("device_name", token.getDeviceName());
            data.put("enable", token.getEnable());
            
            if (token.getDateCreation() != null) {
                data.put("date_creation", token.getDateCreation().atStartOfDay()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("last_update", token.getLastUpdate()
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            
            if (token.getUtilisateur() != null) {
                data.put("id_utilisateur", token.getUtilisateur().getIdUtilisateur());
            }
            
            firestore.collection("utilisateur_fcm_tokens")
                .document(String.valueOf(token.getIdUtilisateurFcmTokens()))  // Utiliser le token comme document ID
                .set(data).get();
        }
        log.info("{} tokens FCM recréés dans Firebase", tokens.size());
        return tokens.size();
    }

    /**
     * Récupérer tous les tokens d'un utilisateur pour lui envoyer des notifications
     * @param idUtilisateur ID de l'utilisateur
     * @return Liste de tous les tokens FCM de cet utilisateur
     */
    @Transactional(readOnly = true)
    public List<UtilisateurFcmTokens> getTokensByUtilisateur(Integer idUtilisateur) {
        return utilisateurFcmTokensRepository.findByUtilisateur_IdUtilisateur(idUtilisateur);
    }

    /**
     * Récupérer tous les tokens ACTIVÉS d'un utilisateur pour lui envoyer des notifications
     * @param idUtilisateur ID de l'utilisateur
     * @return Liste des tokens FCM activés (enable = true) de cet utilisateur
     */
    @Transactional(readOnly = true)
    public List<UtilisateurFcmTokens> getEnabledTokensByUtilisateur(Integer idUtilisateur) {
        return utilisateurFcmTokensRepository.findByUtilisateur_IdUtilisateurAndEnableTrue(idUtilisateur);
    }

    /**
     * Enregistrer un nouveau token FCM pour un utilisateur
     * @param idUtilisateur ID de l'utilisateur
     * @param fcmToken Token FCM du device
     * @param deviceName Nom du device (Mobile, Web, Tablet)
     */
    @Transactional
    public UtilisateurFcmTokens registerFcmToken(Integer idUtilisateur, String fcmToken, String deviceName) {
        Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + idUtilisateur));

        // Vérifier si le token existe déjà
        if (utilisateurFcmTokensRepository.existsByFcmToken(fcmToken)) {
            log.info("Token FCM déjà enregistré: {}", fcmToken);
            return utilisateurFcmTokensRepository.findByFcmToken(fcmToken).get();
        }

        // Créer un nouveau token
        UtilisateurFcmTokens newToken = new UtilisateurFcmTokens();
        newToken.setFcmToken(fcmToken);
        newToken.setDeviceName(deviceName);
        newToken.setUtilisateur(utilisateur);
        newToken.setDateCreation(LocalDate.now());
        newToken.setLastUpdate(LocalDateTime.now());
        newToken.setEnable(true);  // Activé par défaut

        return utilisateurFcmTokensRepository.save(newToken);
    }

    /**
     * Supprimer un token FCM
     * @param fcmToken Token à supprimer
     */
    @Transactional
    public void removeFcmToken(String fcmToken) {
        utilisateurFcmTokensRepository.deleteByFcmToken(fcmToken);
        log.info("Token FCM supprimé: {}", fcmToken);
    }
}
