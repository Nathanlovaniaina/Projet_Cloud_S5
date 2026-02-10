package com.signalement.repository;

import com.signalement.entity.PrixMCarree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PrixMCarreeRepository extends JpaRepository<PrixMCarree, Integer> {
    
    @Query("SELECT p FROM PrixMCarree p WHERE p.dateChangement <= :date ORDER BY p.dateChangement DESC LIMIT 1")
    Optional<PrixMCarree> findPrixAtDate(@Param("date") LocalDate date);
    
    Optional<PrixMCarree> findTopByOrderByDateChangementDesc();
}
