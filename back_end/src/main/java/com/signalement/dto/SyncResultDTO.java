package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncResultDTO {
    private boolean success;
    private LocalDateTime syncDate;
    private String message;
    private Map<String, Integer> stats; // Collection -> Nombre d'items synchronisés
    private String error;
}
