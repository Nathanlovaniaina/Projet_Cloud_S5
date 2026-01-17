package com.signalement.repository;

import com.signalement.entity.StatutAssignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StatutAssignationRepository extends JpaRepository<StatutAssignation, Integer> {
    Optional<StatutAssignation> findByLibelle(String libelle);
}
