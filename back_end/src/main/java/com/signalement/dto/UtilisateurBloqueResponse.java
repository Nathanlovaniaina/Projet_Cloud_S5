package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurBloqueResponse {
    private Integer idUtilisateur;
    private String nom;
    private String prenom;
    private String email;
    private Boolean isBlocked;
    private String typeUtilisateur;
}
