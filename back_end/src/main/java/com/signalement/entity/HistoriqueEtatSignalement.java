package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_etat_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueEtatSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historique")
    private Integer idHistorique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_signalement", nullable = false)
    private Signalement signalement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_etat_signalement", nullable = false)
    private EtatSignalement etatSignalement;

    @Column(name = "date_changement_etat", nullable = false)
    private LocalDateTime dateChangement = LocalDateTime.now();

    @Column(name = "last_update", nullable = false)
    private LocalDateTime lastUpdate;

    @PrePersist
    protected void onCreate() {
        lastUpdate = LocalDateTime.now();
        if (dateChangement == null) {
            dateChangement = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
}
