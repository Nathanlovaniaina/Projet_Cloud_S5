package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateur_fcm_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurFcmTokens {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_utilisateur_fcm_tokens")
    private Integer idUtilisateurFcmTokens;

    @Column(name = "fcm_token", length = 255, nullable = false, unique = true)
    private String fcmToken;

    @Column(name = "device_name", length = 100, nullable = false)
    private String deviceName;

    @Column(name = "date_creation", nullable = false)
    private LocalDate dateCreation;

    @Column(name = "last_update", nullable = false)
    private LocalDateTime lastUpdate;

    @Column(name = "enable", nullable = false)
    private Boolean enable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur utilisateur;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (dateCreation == null) {
            dateCreation = now.toLocalDate();
        }
        lastUpdate = now;
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
}
