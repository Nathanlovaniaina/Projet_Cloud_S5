package com.signalement.repository;

import com.signalement.entity.Session;
import com.signalement.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Integer> {
    Optional<Session> findByToken(String token);
    Optional<Session> findByUtilisateur(Utilisateur utilisateur);
}
