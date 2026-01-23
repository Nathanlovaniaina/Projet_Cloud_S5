package com.signalement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la modification du statut d'un signalement (Tâche 23)
 * Utilisé par PATCH /api/signalements/{id}/status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSignalementStatusRequest {
    
    @NotNull(message = "L'état est obligatoire")
    private Integer etatId;
}
