package com.signalement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSignalementRequest {
    
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;
    
    private String description;
    
    @NotNull(message = "La latitude est obligatoire")
    @DecimalMin(value = "-25.6", message = "Latitude invalide pour Madagascar")
    @DecimalMax(value = "-11.9", message = "Latitude invalide pour Madagascar")
    private BigDecimal latitude;
    
    @NotNull(message = "La longitude est obligatoire")
    @DecimalMin(value = "43.2", message = "Longitude invalide pour Madagascar")
    @DecimalMax(value = "50.5", message = "Longitude invalide pour Madagascar")
    private BigDecimal longitude;
    
    private Integer idTypeTravail;
    
    private String urlPhoto;
}
