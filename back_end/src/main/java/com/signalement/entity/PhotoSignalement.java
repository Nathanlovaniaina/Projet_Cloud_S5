package com.signalement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "photo_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhotoSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_photo_signalement")
    private Integer idPhotoSignalement;

    @Column(name = "url_photo", length = 250, nullable = false, unique = true)
    private String urlPhoto;

    @Column(name = "date_ajout", nullable = false)
    private LocalDate dateAjout;

    @Column(name = "lats_update", nullable = false)
    private LocalDateTime lastUpdate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_signalement", nullable = false)
    @JsonIgnore
    private Signalement signalement;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (dateAjout == null) {
            dateAjout = now.toLocalDate();
        }
        lastUpdate = now;
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
}
