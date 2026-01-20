package com.signalement.controller;

import com.signalement.dto.*;
import com.signalement.entity.Utilisateur;
import com.signalement.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    /**
     * Tâche 11: API REST - Inscription (email/pwd)
     * POST /api/auth/inscription
     */
    @PostMapping("/inscription")
    public ResponseEntity<ApiResponse> inscription(@RequestBody InscriptionRequest request) {
        ApiResponse response = authenticationService.inscription(request);
        return ResponseEntity
                .status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * Tâche 12: API REST - Authentification (email/pwd)
     * POST /api/auth/login
     * Inclut Tâche 13 (gestion des sessions) et Tâche 15 (limite de tentatives)
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        AuthenticationResponse response = authenticationService.authenticate(request);
        
        if (response.getToken() != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Déconnexion (invalidation de session)
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@RequestHeader("Authorization") String token) {
        ApiResponse response = authenticationService.logout(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Tâche 14: API REST - Modification des infos utilisateurs
     * PUT /api/auth/utilisateur/{id}
     */
    @PutMapping("/utilisateur/{id}")
    public ResponseEntity<ApiResponse> updateUtilisateur(
            @PathVariable Integer id,
            @RequestBody UpdateUtilisateurRequest request,
            @RequestHeader("Authorization") String token) {
        
        ApiResponse response = authenticationService.updateUtilisateur(id, request, token);
        return ResponseEntity
                .status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * Tâche 16: API REST - Déblocage d'utilisateur
     * POST /api/auth/debloquer/{id}
     */
    @PostMapping("/debloquer/{id}")
    public ResponseEntity<ApiResponse> debloquerUtilisateur(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String token) {
        
        ApiResponse response = authenticationService.debloquerUtilisateur(id, token);
        return ResponseEntity
                .status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * Liste des utilisateurs bloqués (pour les managers)
     * GET /api/auth/bloques
     */
    @GetMapping("/bloques")
    public ResponseEntity<?> getUtilisateursBloqués(@RequestHeader("Authorization") String token) {
        try {
            List<UtilisateurBloqueResponse> utilisateurs = authenticationService.getUtilisateursBloqués(token);
            return ResponseEntity.ok(utilisateurs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
