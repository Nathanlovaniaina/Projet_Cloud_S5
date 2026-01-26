package com.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.signalement.entity.Utilisateur;
import com.signalement.entity.TypeUtilisateur;
import com.signalement.repository.UtilisateurRepository;
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
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final TypeUtilisateurRepository typeUtilisateurRepository;
    private final FirebaseConversionService firebaseConversionService;
    private final Firestore firestore;

    @Transactional(readOnly = true)
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Utilisateur> getUtilisateurById(Integer id) {
        return utilisateurRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Utilisateur> getUtilisateurByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }

    @Transactional
    public Utilisateur createUtilisateur(Utilisateur utilisateur) {
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new IllegalArgumentException("Un utilisateur avec cet email existe déjà");
        }
        return utilisateurRepository.save(utilisateur);
    }

    @Transactional
    public Utilisateur updateUtilisateur(Integer id, Utilisateur utilisateur) {
        return utilisateurRepository.findById(id)
                .map(existing -> {
                    existing.setNom(utilisateur.getNom());
                    existing.setPrenom(utilisateur.getPrenom());
                    existing.setEmail(utilisateur.getEmail());
                    existing.setIsBlocked(utilisateur.getIsBlocked());
                    return utilisateurRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));
    }

    @Transactional
    public void deleteUtilisateur(Integer id) {
        utilisateurRepository.deleteById(id);
    }

    // ======== FIREBASE SYNC METHODS (Tâches 31 & 32) ========
    
    @Transactional
    public int syncFromFirebase(LocalDateTime lastSyncDate) throws ExecutionException, InterruptedException {
        CollectionReference collection = firestore.collection("utilisateurs");
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
                var existing = utilisateurRepository.findById(id);
                
                if (existing.isEmpty() || firebaseLastUpdate.isAfter(existing.get().getLastUpdate())) {
                    Utilisateur utilisateur = existing.orElse(new Utilisateur());
                    utilisateur.setIdUtilisateur(id);
                    utilisateur.setNom(doc.getString("nom"));
                    utilisateur.setPrenom(doc.getString("prenom"));
                    utilisateur.setEmail(doc.getString("email"));
                    utilisateur.setMotDePasse(doc.getString("mot_de_passe_hash"));
                    // Synchronisation du firebase UID
                    utilisateur.setFirebaseUid(doc.getString("firebase_uid"));
                    
                    Boolean isBlocked = doc.getBoolean("is_blocked");
                    utilisateur.setIsBlocked(isBlocked != null ? isBlocked : false);
                    
                    Integer typeId = firebaseConversionService.getLongAsInteger(doc, "id_type_utilisateur");
                    TypeUtilisateur type = typeUtilisateurRepository.findById(typeId).orElse(null);
                    
                    if (type != null) {
                        utilisateur.setTypeUtilisateur(type);
                        utilisateurRepository.save(utilisateur);
                        synced++;
                    }
                }
            }
        }
        return synced;
    }

    @Transactional(readOnly = true)
    public int syncAllToFirebase() throws ExecutionException, InterruptedException {
        List<Utilisateur> utilisateurs = utilisateurRepository.findAll();
        for (Utilisateur utilisateur : utilisateurs) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", utilisateur.getIdUtilisateur());
            data.put("nom", utilisateur.getNom());
            data.put("prenom", utilisateur.getPrenom());
            data.put("email", utilisateur.getEmail());
            data.put("mot_de_passe_hash", utilisateur.getMotDePasse());
            // Inclure le firebase UID si présent
            if (utilisateur.getFirebaseUid() != null) {
                data.put("firebase_uid", utilisateur.getFirebaseUid());
            }
            data.put("is_blocked", utilisateur.getIsBlocked());
            data.put("last_update", utilisateur.getLastUpdate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            data.put("id_type_utilisateur", utilisateur.getTypeUtilisateur().getIdTypeUtilisateur());
            
            firestore.collection("utilisateurs")
                .document(String.valueOf(utilisateur.getIdUtilisateur()))
                .set(data).get();
        }
        log.info("{} utilisateurs recréés", utilisateurs.size());
        return utilisateurs.size();
    }
}
