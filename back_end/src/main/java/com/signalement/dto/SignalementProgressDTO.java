package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * DTO pour retourner l'avancement d'un signalement
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementProgressDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Integer idSignalement;
    private Integer etatId;
    private String etatLibelle;
    private Integer pourcentageAvancement;  // 0, 50, ou 100
}
