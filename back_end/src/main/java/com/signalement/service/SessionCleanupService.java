package com.signalement.service;

import com.signalement.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SessionCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(SessionCleanupService.class);

    private final SessionRepository sessionRepository;

    // Runs every `session.cleanup.rate.millis` milliseconds (default 3600000 = 1h)
    @Scheduled(fixedRateString = "${session.cleanup.rate.millis:3600000}")
    @Transactional
    public void purgeExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        long deleted = sessionRepository.deleteByDateFinBefore(now);
        if (deleted > 0) {
            logger.info("Purge expired sessions: {} deleted", deleted);
        }
    }
}
