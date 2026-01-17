package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_signalement")
    private Integer idSignalement;

    @Column(name = "titre", nullable = false, length = 100)
    private String titre;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "latitude", nullable = false, precision = 15, scale = 10)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 15, scale = 10)
    private BigDecimal longitude;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etat_actuel", nullable = false)
    private EtatSignalement etatActuel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_type_travail")
    private TypeTravail typeTravail;

    @Column(name = "url_photo", length = 255)
    private String urlPhoto;

    @Column(name = "last_sync")
    private LocalDateTime lastSync;

    @Column(name = "synced")
    private Boolean synced = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "geom", columnDefinition = "geography(Point,4326)")
    private Point geom;

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
