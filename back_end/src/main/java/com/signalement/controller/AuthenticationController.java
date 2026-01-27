package com.signalement.controller;

import com.signalement.dto.*;
import com.signalement.entity.Utilisateur;
import com.signalement.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Authentification", description = "API de gestion de l'authentification et des utilisateurs")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    /**
     * Tâche 11: API REST - Inscription (email/pwd)
     * POST /api/auth/inscription
     */
    @Operation(
        summary = "Inscription d'un nouvel utilisateur",
        description = "Permet à un nouvel utilisateur de créer un compte avec email et mot de passe. Le type d'utilisateur doit être spécifié (citoyen ou manager)."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Utilisateur créé avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides ou email déjà utilisé",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class)))
    })
    @PostMapping("/inscription")
    public ResponseEntity<com.signalement.dto.ApiResponse> inscription(
            @Parameter(description = "Informations d'inscription de l'utilisateur", required = true)
            @RequestBody InscriptionRequest request) {
        com.signalement.dto.ApiResponse response = authenticationService.inscription(request);
        return ResponseEntity
                .status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * Tâche 12: API REST - Authentification (email/pwd)
     * POST /api/auth/login
     * Inclut Tâche 13 (gestion des sessions) et Tâche 15 (limite de tentatives)
     */
    @Operation(
        summary = "Connexion d'un utilisateur",
        description = "Authentifie un utilisateur avec email et mot de passe. Génère un token de session avec durée de vie. Limite à 3 tentatives de connexion échouées avant blocage du compte."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Authentification réussie, token retourné",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticationResponse.class))),
        @ApiResponse(responseCode = "401", description = "Identifiants incorrects ou compte bloqué",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthenticationResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @Parameter(description = "Identifiants de connexion", required = true)
            @RequestBody AuthenticationRequest request) {
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
    @Operation(
        summary = "Déconnexion de l'utilisateur",
        description = "Invalide la session en cours et supprime le token d'authentification."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Déconnexion réussie",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class)))
    })
    @PostMapping("/logout")
    public ResponseEntity<com.signalement.dto.ApiResponse> logout(
            @Parameter(description = "Token d'authentification Bearer", required = true, example = "Bearer <token>")
            @RequestHeader("Authorization") String token) {
        com.signalement.dto.ApiResponse response = authenticationService.logout(token);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/firebase-login
     * Échange un idToken Firebase (côté client) contre une session backend après vérification.
     */
    @Operation(
        summary = "Connexion via Firebase idToken",
        description = "Vérifie l'idToken Firebase côté serveur, associe/cherche l'utilisateur par firebase_uid ou email, et crée une session backend."
    )
    @PostMapping("/firebase-login")
    public ResponseEntity<AuthenticationResponse> firebaseLogin(@RequestBody java.util.Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthenticationResponse("idToken manquant"));
        }

        AuthenticationResponse response = authenticationService.authenticateWithFirebase(idToken);
        if (response.getToken() != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Tâche 14: API REST - Modification des infos utilisateurs
     * PUT /api/auth/utilisateur/{id}
     */
    @Operation(
        summary = "Modifier les informations d'un utilisateur",
        description = "Permet à un utilisateur de modifier ses informations personnelles. Authentification requise."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Informations mises à jour avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class))),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Non autorisé à modifier cet utilisateur")
    })
    @PutMapping("/utilisateur/{id}")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateUtilisateur(
            @Parameter(description = "ID de l'utilisateur à modifier", required = true)
            @PathVariable Integer id,
            @Parameter(description = "Nouvelles informations de l'utilisateur", required = true)
            @RequestBody UpdateUtilisateurRequest request,
            @Parameter(description = "Token d'authentification Bearer", required = true, example = "Bearer <token>")
            @RequestHeader("Authorization") String token) {
        
        com.signalement.dto.ApiResponse response = authenticationService.updateUtilisateur(id, request, token);
        return ResponseEntity
                .status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * Tâche 16: API REST - Déblocage d'utilisateur
     * POST /api/auth/debloquer/{id}
     */
    @Operation(
        summary = "Débloquer un utilisateur",
        description = "Permet à un manager de débloquer un utilisateur dont le compte a été bloqué après 3 tentatives de connexion échouées. Réservé aux managers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Utilisateur débloqué avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class))),
        @ApiResponse(responseCode = "400", description = "Erreur lors du déblocage",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class))),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès réservé aux managers")
    })
    @PostMapping("/debloquer/{id}")
    public ResponseEntity<com.signalement.dto.ApiResponse> debloquerUtilisateur(
            @Parameter(description = "ID de l'utilisateur à débloquer", required = true)
            @PathVariable Integer id,
            @Parameter(description = "Token d'authentification Bearer du manager", required = true, example = "Bearer <token>")
            @RequestHeader("Authorization") String token) {
        
        com.signalement.dto.ApiResponse response = authenticationService.debloquerUtilisateur(id, token);
        return ResponseEntity
                .status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * Liste des utilisateurs bloqués (pour les managers)
     * GET /api/auth/bloques
     */
    @Operation(
        summary = "Récupérer la liste des utilisateurs bloqués",
        description = "Retourne la liste de tous les utilisateurs dont le compte est bloqué. Réservé aux managers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste retournée avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = UtilisateurBloqueResponse.class))),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès réservé aux managers",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.signalement.dto.ApiResponse.class)))
    })
    @GetMapping("/bloques")
    public ResponseEntity<?> getUtilisateursBloqués(
            @Parameter(description = "Token d'authentification Bearer du manager", required = true, example = "Bearer <token>")
            @RequestHeader("Authorization") String token) {
        try {
            List<UtilisateurBloqueResponse> utilisateurs = authenticationService.getUtilisateursBloqués(token);
            return ResponseEntity.ok(utilisateurs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }
}
