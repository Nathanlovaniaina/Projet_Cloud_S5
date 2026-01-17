package com.signalement.repository;

import com.signalement.entity.TypeTravail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TypeTravailRepository extends JpaRepository<TypeTravail, Integer> {
    Optional<TypeTravail> findByLibelle(String libelle);
}
