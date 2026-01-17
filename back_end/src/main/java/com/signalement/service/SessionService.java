package com.signalement.service;

import com.signalement.entity.Session;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    @Transactional
    public Session createSession(Utilisateur utilisateur, int durationHours) {
        Session session = new Session();
        session.setToken(UUID.randomUUID().toString());
        session.setUtilisateur(utilisateur);
        session.setDateDebut(LocalDateTime.now());
        session.setDateFin(LocalDateTime.now().plusHours(durationHours));
        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public Optional<Session> getSessionByToken(String token) {
        return sessionRepository.findByToken(token);
    }

    @Transactional(readOnly = true)
    public boolean isSessionValid(String token) {
        return sessionRepository.findByToken(token)
                .map(session -> session.getDateFin().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    @Transactional
    public void deleteSession(Integer id) {
        sessionRepository.deleteById(id);
    }
}
