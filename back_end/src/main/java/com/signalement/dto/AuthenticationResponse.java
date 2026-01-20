package com.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse {
    private String token;
    private Integer idUtilisateur;
    private String nom;
    private String prenom;
    private String email;
    private String typeUtilisateur;
    private String message;

    public AuthenticationResponse(String message) {
        this.message = message;
    }
}
