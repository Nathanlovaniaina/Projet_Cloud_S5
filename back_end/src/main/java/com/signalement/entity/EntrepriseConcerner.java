package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "entreprise_concerner")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntrepriseConcerner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_entreprise_concerner")
    private Integer idEntrepriseConcerner;

    @Column(name = "date_creation")
    private LocalDate dateCreation = LocalDate.now();

    @Column(name = "montant", precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "last_update", nullable = false)
    private LocalDateTime lastUpdate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_statut_assignation")
    private StatutAssignation statutAssignation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_signalement", nullable = false)
    private Signalement signalement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entreprise", nullable = false)
    private Entreprise entreprise;

    @PrePersist
    protected void onCreate() {
        lastUpdate = LocalDateTime.now();
        if (dateCreation == null) {
            dateCreation = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
}
