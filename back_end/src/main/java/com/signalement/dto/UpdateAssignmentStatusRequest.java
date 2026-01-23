package com.signalement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAssignmentStatusRequest {
    
    @NotNull(message = "L'ID du statut est requis")
    private Integer idStatutAssignation;
    
    private String commentaire; // Optionnel
}
