package com.signalement.repository;

import com.signalement.entity.EntrepriseConcerner;
import com.signalement.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EntrepriseConcernerRepository extends JpaRepository<EntrepriseConcerner, Integer> {
    List<EntrepriseConcerner> findBySignalement(Signalement signalement);
    
    List<EntrepriseConcerner> findBySignalement_IdSignalement(Integer signalementId);
    
    Optional<EntrepriseConcerner> findBySignalement_IdSignalementAndEntreprise_IdEntreprise(
        Integer signalementId, 
        Integer entrepriseId);
}
