package com.signalement.repository;

import com.signalement.entity.UtilisateurFcmTokens;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurFcmTokensRepository extends JpaRepository<UtilisateurFcmTokens, Integer> {
    
    /**
     * Trouver tous les tokens d'un utilisateur
     */
    List<UtilisateurFcmTokens> findByUtilisateur_IdUtilisateur(Integer idUtilisateur);
    
    /**
     * Trouver un token spécifique
     */
    Optional<UtilisateurFcmTokens> findByFcmToken(String fcmToken);
    
    /**
     * Vérifier si un token existe
     */
    boolean existsByFcmToken(String fcmToken);
    
    /**
     * Supprimer un token spécifique
     */
    void deleteByFcmToken(String fcmToken);
}
