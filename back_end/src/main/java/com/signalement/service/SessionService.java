package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.Session;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.SessionRepository;
import com.signalement.repository.UtilisateurRepository;
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
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    @Transactional
    public Session createSession(Utilisateur utilisateur, int durationHours) {
        Session session = new Session();
        session.setToken(UUID.randomUUID().toString());
        session.setUtilisateur(utilisateur);
        session.setDateDebut(LocalDateTime.now());
        session.setDateFin(LocalDateTime.now().plusHours(durationHours));
        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public Optional<Session> getSessionByToken(String token) {
        return sessionRepository.findByToken(token);
    }

    @Transactional(readOnly = true)
    public boolean isSessionValid(String token) {
        return sessionRepository.findByToken(token)
                .map(session -> session.getDateFin().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    @Transactional
    public void deleteSession(Integer id) {
        sessionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Utilisateur> getUtilisateurByToken(String token) {
        return sessionRepository.findByToken(token)
                .filter(session -> session.getDateFin().isAfter(LocalDateTime.now()))
                .map(Session::getUtilisateur);
    }

    @Transactional
    public boolean refreshSession(String token, int additionalHours) {
        Optional<Session> opt = sessionRepository.findByToken(token);
        if (opt.isPresent()) {
            Session session = opt.get();
            session.setDateFin(session.getDateFin().plusHours(additionalHours));
            sessionRepository.save(session);
            return true;
        }
        return false;
    }

    @Transactional
    public void invalidateSession(String token) {
        sessionRepository.findByToken(token).ifPresent(sessionRepository::delete);
    }

    // ======== FIREBASE SYNC METHODS (Tâches 31 & 32) ========
    
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("sessions");
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
                var existing = sessionRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    Session session = existing.orElse(new Session());
                    session.setIdSession(id);
                    session.setToken(doc.getString("token"));
                    
                    Long dateDebutMs = firebaseConversionService.getLongValue(doc, "date_debut");
                    if (dateDebutMs != null) {
                        session.setDateDebut(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateDebutMs), ZoneId.systemDefault()));
                    }
                    
                    Long dateFinMs = firebaseConversionService.getLongValue(doc, "date_fin");
                    if (dateFinMs != null) {
                        session.setDateFin(LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(dateFinMs), ZoneId.systemDefault()));
                    }
                    
                    Integer utilisateurId = firebaseConversionService.getLongAsInteger(doc, "id_utilisateur");
                    Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
                    
                    if (utilisateur != null) {
                        session.setUtilisateur(utilisateur);
                        sessionRepository.save(session);
                        synced++;
                    }
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<Session> sessions = sessionRepository.findAll();
        for (Session session : sessions) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", session.getIdSession());
            data.put("token", session.getToken());
            
            if (session.getDateDebut() != null) {
                data.put("date_debut", session.getDateDebut()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            if (session.getDateFin() != null) {
                data.put("date_fin", session.getDateFin()
                    .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            }
            
            data.put("last_update", session.getLastUpdate()
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            data.put("id_utilisateur", session.getUtilisateur().getIdUtilisateur());
            
            firestore.collection("sessions")
                .document(String.valueOf(session.getIdSession()))
                .set(data).get();
        }
        log.info("{} sessions recréées", sessions.size());
        return sessions.size();
    }
}
