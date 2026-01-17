package com.signalement.repository;

import com.signalement.entity.EtatSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EtatSignalementRepository extends JpaRepository<EtatSignalement, Integer> {
    Optional<EtatSignalement> findByLibelle(String libelle);
}
