package com.signalement.repository;

import com.signalement.entity.HistoriqueStatutAssignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoriqueStatutAssignationRepository extends JpaRepository<HistoriqueStatutAssignation, Integer> {
}
