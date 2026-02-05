package com.signalement.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.signalement.entity.Signalement;
import com.signalement.entity.UtilisateurFcmTokens;
import com.signalement.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final FirebaseMessaging firebaseMessaging;
    private final UtilisateurFcmTokensService utilisateurFcmTokensService;
    private final SignalementRepository signalementRepository;

    /**
     * Envoyer une notification à l'utilisateur créateur du signalement
     * quand le statut change
     * 
     * @param signalementId ID du signalement dont le statut a changé
     * @param newEtatLibelle Nouveau statut (ex: "En cours", "Résolu")
     */
    public void notifySignalementStatusChange(Integer signalementId, String newEtatLibelle) {
        try {
            // Récupérer le signalement
            Signalement signalement = signalementRepository.findById(signalementId)
                    .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé"));

            // Récupérer l'utilisateur créateur
            if (signalement.getUtilisateur() == null) {
                log.warn("Signalement {} n'a pas d'utilisateur associé", signalementId);
                return;
            }

            Integer userId = signalement.getUtilisateur().getIdUtilisateur();

            // Récupérer tous les tokens FCM de l'utilisateur
            List<UtilisateurFcmTokens> fcmTokens = utilisateurFcmTokensService
                    .getTokensByUtilisateur(userId);

            if (fcmTokens.isEmpty()) {
                log.info("Aucun token FCM trouvé pour l'utilisateur {} du signalement {}", 
                        userId, signalementId);
                return;
            }

            // Construire le titre avec le type de travail
            String typeTravauxLibelle = signalement.getTypeTravail() != null 
                    ? signalement.getTypeTravail().getLibelle()
                    : "Signalement";
            
            String title = String.format("Signalement #%d (%s) - Statut changé", 
                    signalementId, typeTravauxLibelle);
            String body = String.format("Votre signalement est maintenant %s", newEtatLibelle);

            // Envoyer la notification à chaque device de l'utilisateur
            for (UtilisateurFcmTokens tokenObj : fcmTokens) {
                sendNotificationToDevice(tokenObj.getFcmToken(), title, body);
            }

            log.info("Notification envoyée à {} device(s) pour le signalement {}", 
                    fcmTokens.size(), signalementId);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification pour le signalement {}: {}", 
                    signalementId, e.getMessage(), e);
            // Ne pas lever d'exception pour ne pas bloquer la mise à jour du signalement
        }
    }

    /**
     * Envoyer une notification à un device spécifique via son token FCM
     * 
     * @param fcmToken Token FCM du device
     * @param title Titre de la notification
     * @param body Corps du message
     */
    private void sendNotificationToDevice(String fcmToken, String title, String body) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setNotification(notification)
                    .setToken(fcmToken)
                    .build();

            String response = firebaseMessaging.send(message);
            log.debug("Notification envoyée au token {}: {}", fcmToken, response);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification au token {}: {}", 
                    fcmToken, e.getMessage());
        }
    }
}
