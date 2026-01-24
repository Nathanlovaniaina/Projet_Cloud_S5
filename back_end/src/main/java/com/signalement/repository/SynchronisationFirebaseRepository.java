package com.signalement.repository;

import com.signalement.entity.SynchronisationFirebase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SynchronisationFirebaseRepository extends JpaRepository<SynchronisationFirebase, Integer> {
    
    /**
     * Récupérer la date de la dernière synchronisation réussie (depuis Firebase)
     */
    @Query("SELECT MAX(s.dateSynchronisation) FROM SynchronisationFirebase s WHERE s.success = true AND s.remarque LIKE '%Firebase%PostgreSQL%'")
    Optional<LocalDateTime> findLastSuccessfulSyncFromFirebaseDate();
    
    /**
     * Récupérer les 10 dernières synchronisations
     */
    @Query("SELECT s FROM SynchronisationFirebase s ORDER BY s.dateSynchronisation DESC")
    List<SynchronisationFirebase> findTop10ByOrderByDateSynchronisationDesc();
}
