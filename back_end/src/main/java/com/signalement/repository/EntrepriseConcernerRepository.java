package com.signalement.repository;

import com.signalement.entity.EntrepriseConcerner;
import com.signalement.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EntrepriseConcernerRepository extends JpaRepository<EntrepriseConcerner, Integer> {
    List<EntrepriseConcerner> findBySignalement(Signalement signalement);
}
