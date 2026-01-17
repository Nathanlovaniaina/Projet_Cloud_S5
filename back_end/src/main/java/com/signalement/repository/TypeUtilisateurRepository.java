package com.signalement.repository;

import com.signalement.entity.TypeUtilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TypeUtilisateurRepository extends JpaRepository<TypeUtilisateur, Integer> {
    Optional<TypeUtilisateur> findByLibelle(String libelle);
}
