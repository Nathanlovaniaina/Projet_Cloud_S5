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
    private BigDecimal surfaceMetreCarree;
    private LocalDateTime dateCreation;
    private String urlPhoto;
    // synced and lastSync removed from schema
    private Integer etatActuelId;
    private String etatLibelle;
    private Integer idTypeTravail;
    private String typeTravauxLibelle;
    private Integer idUtilisateur;
    
    // Constructor simplifié pour compatibilité
    public SignalementDTO(Integer idSignalement, String titre, String description, 
                         BigDecimal latitude, BigDecimal longitude, BigDecimal surfaceMetreCarree,
                         LocalDateTime dateCreation, String urlPhoto, Integer etatActuelId) {
        this.idSignalement = idSignalement;
        this.titre = titre;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.surfaceMetreCarree = surfaceMetreCarree;
        this.dateCreation = dateCreation;
        this.urlPhoto = urlPhoto;
        this.etatActuelId = etatActuelId;
    }
}
