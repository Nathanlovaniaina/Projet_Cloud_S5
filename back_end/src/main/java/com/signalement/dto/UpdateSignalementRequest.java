package com.signalement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la modification d'un signalement (Tâche 22)
 * Utilisé par PUT /api/signalements/{id}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSignalementRequest {
    
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;
    
    private String description;
    
    private Integer idTypeTravail;
    
    private String urlPhoto;
}
