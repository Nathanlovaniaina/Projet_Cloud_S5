package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO pour la réponse du changement de statut d'un signalement
 * Inclut le signalement mis à jour et la liste des devices notifiés
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalementStatusChangeResponse {
    private SignalementDTO signalement;
    private List<String> devicesNotified;
}
