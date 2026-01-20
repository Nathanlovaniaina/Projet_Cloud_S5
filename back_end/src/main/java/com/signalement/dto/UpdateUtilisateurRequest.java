package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUtilisateurRequest {
    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
}
