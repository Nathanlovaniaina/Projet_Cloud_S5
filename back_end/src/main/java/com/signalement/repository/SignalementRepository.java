package com.signalement.repository;

import com.signalement.entity.Signalement;
import com.signalement.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Integer> {
    List<Signalement> findByUtilisateur(Utilisateur utilisateur);
    
    // etatActuel removed - use HistoriqueEtatSignalementRepository.findCurrentSignalementsByEtat() instead
    
    // Requête spatiale exemple (à adapter selon besoin)
    @Query(value = "SELECT * FROM signalement WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :distance)", 
           nativeQuery = true)
    List<Signalement> findSignalementsNearby(@Param("latitude") Double latitude, 
                                             @Param("longitude") Double longitude, 
                                             @Param("distance") Double distance);
}
