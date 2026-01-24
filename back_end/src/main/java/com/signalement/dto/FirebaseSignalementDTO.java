package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FirebaseSignalementDTO {
    private String firebaseId;
    private String titre;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal surfaceMetreCarree;
    private LocalDateTime dateCreation;
    private String urlPhoto;
    private LocalDateTime lastUpdate;
    private Integer idTypeTravail;
    private Integer idUtilisateur;
    private Integer idEtatSignalement;
}
