package com.signalement.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignEnterpriseRequest {
    
    @NotNull(message = "L'ID de l'entreprise est requis")
    private Integer idEntreprise;
    
    @NotNull(message = "La date de début est requise")
    private LocalDate dateDebut;
    
    @NotNull(message = "La date de fin est requise")
    private LocalDate dateFin;
    
    @NotNull(message = "Le montant est requis")
    @DecimalMin(value = "0", inclusive = false, message = "Le montant doit être positif")
    private BigDecimal montant;
}
