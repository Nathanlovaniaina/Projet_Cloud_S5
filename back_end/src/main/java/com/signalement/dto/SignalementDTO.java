package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalementDTO {
    private Integer idSignalement;
    private String titre;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime dateCreation;
    private String urlPhoto;
    private Boolean synced;
    private LocalDateTime lastSync;
    private Integer etatActuelId; // optional: id of EtatSignalement
}
