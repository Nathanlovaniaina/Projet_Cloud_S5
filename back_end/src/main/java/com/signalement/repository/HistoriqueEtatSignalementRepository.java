package com.signalement.repository;

import com.signalement.entity.HistoriqueEtatSignalement;
import com.signalement.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HistoriqueEtatSignalementRepository extends JpaRepository<HistoriqueEtatSignalement, Integer> {
    /**
     * Get all historique entries for a signalement, ordered by date descending
     */
    List<HistoriqueEtatSignalement> findBySignalementOrderByDateChangementDesc(Signalement signalement);
    
    /**
     * Find all historique entries by signalement ID
     */
    List<HistoriqueEtatSignalement> findBySignalement_IdSignalementOrderByDateChangementDesc(Integer signalementId);
    
    /**
     * Récupérer l'état le plus récent d'un signalement
     */
    @Query("SELECT h FROM HistoriqueEtatSignalement h WHERE h.signalement = :signalement ORDER BY h.dateChangement DESC LIMIT 1")
    Optional<HistoriqueEtatSignalement> findLatestBySignalement(@Param("signalement") Signalement signalement);
}
