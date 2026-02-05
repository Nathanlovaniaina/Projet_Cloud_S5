package com.signalement.repository;

import com.signalement.entity.PhotoSignalement;
import com.signalement.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhotoSignalementRepository extends JpaRepository<PhotoSignalement, Integer> {
    /**
     * Récupérer toutes les photos d'un signalement
     */
    List<PhotoSignalement> findBySignalement(Signalement signalement);

    /**
     * Récupérer toutes les photos d'un signalement par son ID
     */
    List<PhotoSignalement> findBySignalement_IdSignalement(Integer signalementId);

    /**
     * Vérifier si une URL de photo existe
     */
    boolean existsByUrlPhoto(String urlPhoto);
}
