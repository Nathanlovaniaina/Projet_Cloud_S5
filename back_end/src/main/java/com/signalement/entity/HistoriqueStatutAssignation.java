package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_statut_assignation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueStatutAssignation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historique")
    private Integer idHistorique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entreprise_concerner", nullable = false)
    private EntrepriseConcerner entrepriseConcerner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_statut_assignation", nullable = false)
    private StatutAssignation statutAssignation;

    @Column(name = "date_changement", nullable = false)
    private LocalDateTime dateChangement = LocalDateTime.now();
}
