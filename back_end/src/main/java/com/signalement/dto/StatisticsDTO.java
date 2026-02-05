package com.signalement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StatisticsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    // ========== SIGNALEMENTS ==========
    private Integer totalSignalements;
    private Integer signalementsEnAttente;
    private Integer signalementsEnCours;
    private Integer signalementsTermines;

    // ========== UTILISATEURS ==========
    private Integer totalUtilisateurs;
    private Integer citoyens;
    private Integer managers;
    private Integer comptesBloques;

    // ========== ENTREPRISES ==========
    private Integer totalEntreprises;
    private Integer entreprisesActives;
    private Integer entreprisesInactives;

    // ========== ASSIGNATIONS ==========
    private Integer totalAssignations;
    private Integer assignationsEnCours;
    private Integer assignationsTerminees;

    // ========== TAUX ET MOYENNES ==========
    private Double tauxCompletionMoyen;
    private Double tauxPonctualiteMoyen;
    private Double delaiTraitementMoyenJours;

    // ========== RÉPARTITIONS ==========
    private Map<String, Integer> signalementsParType;
    private Map<String, Integer> signalementsParEtat;

    // ========== TOP ENTREPRISES ==========
    private List<EntreprisePerformanceDTO> top5Entreprises;

    // ========== DATES ==========
    private LocalDateTime dateCalcul;

    // ========== INNER CLASSES ==========

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntreprisePerformanceDTO {
        private Integer idEntreprise;
        private String nomEntreprise;
        private Integer tachesAssignees;
        private Integer tachesTerminees;
        private Double tauxCompletion;
        private Double tauxPonctualite;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TypeTravailStatDTO {
        private Integer idTypeTravail;
        private String nomType;
        private Integer total;
        private Integer enAttente;
        private Integer enCours;
        private Integer termine;
        private Double pourcentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EtatStatDTO {
        private Integer idEtat;
        private String etat;
        private Integer count;
        private Double pourcentage;
    }
}
