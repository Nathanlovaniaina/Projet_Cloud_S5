package com.signalement.repository;

import com.signalement.entity.HistoriqueEtatSignalement;
import com.signalement.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueEtatSignalementRepository extends JpaRepository<HistoriqueEtatSignalement, Integer> {
    List<HistoriqueEtatSignalement> findBySignalementOrderByDateChangementEtatDesc(Signalement signalement);
}
