package com.signalement.repository;

import com.signalement.entity.TentativeConnexion;
import com.signalement.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TentativeConnexionRepository extends JpaRepository<TentativeConnexion, Integer> {
    List<TentativeConnexion> findByUtilisateurAndDateTentativeAfter(Utilisateur utilisateur, LocalDateTime date);
}
