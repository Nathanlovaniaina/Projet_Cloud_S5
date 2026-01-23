package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntrepriseConcernerDTO {
    
    private Integer idEntrepriseConcerner;
    private LocalDate dateCreation;
    private BigDecimal montant;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalDateTime lastUpdate;
    
    // Statut assignation
    private Integer idStatutAssignation;
    private String statutLibelle;
    
    // Infos Entreprise
    private Integer idEntreprise;
    private String nomEntreprise;
    private String emailEntreprise;
    
    // Infos Signalement
    private Integer idSignalement;
    private String titreSignalement;
    private String descriptionSignalement;
}
