package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalementDetailsDTO {
    private Integer idSignalement;
    private String titre;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal surfaceMetreCarree;
    private LocalDateTime dateCreation;
    private String urlPhoto;

    private Integer currentEtatId;
    private String currentEtatLibelle;
    private Integer progressionPercent;

    private List<EntrepriseConcernerDTO> assignations;

    private List<EtatHistoryEntryDTO> historiqueEtat;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EtatHistoryEntryDTO {
        private Integer idEtat;
        private String libelle;
        private LocalDateTime dateChangement;
    }
}
