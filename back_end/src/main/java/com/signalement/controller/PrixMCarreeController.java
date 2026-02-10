package com.signalement.controller;

import com.signalement.entity.PrixMCarree;
import com.signalement.entity.Utilisateur;
import com.signalement.service.PrixMCarreeService;
import com.signalement.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/prix-m-carree")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Prix m²", description = "API de gestion des prix au mètre carré")
public class PrixMCarreeController {

    private final PrixMCarreeService prixMCarreeService;
    private final SessionService sessionService;

    /**
     * GET /api/prix-m-carree
     * Récupère le prix m² valide à une date donnée
     */
    @Operation(
        summary = "Récupérer le prix m² à une date",
        description = "Retourne le prix au mètre carré valide à la date spécifiée. Si aucune date n'est fournie, retourne le prix le plus récent. Accès réservé aux managers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Prix trouvé avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PrixMCarree.class))),
        @ApiResponse(responseCode = "401", description = "Token manquant ou invalide"),
        @ApiResponse(responseCode = "403", description = "Accès réservé aux managers"),
        @ApiResponse(responseCode = "404", description = "Aucun prix trouvé pour cette date")
    })
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPrixAtDate(
            @Parameter(description = "Header Authorization Bearer <token>")
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "Date pour laquelle récupérer le prix (format: yyyy-MM-dd). Si omis, retourne le prix le plus récent.")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        // Vérification du token
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String token = authorization.substring("Bearer ".length());
        Optional<Utilisateur> opt = sessionService.getUtilisateurByToken(token);
        if (opt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid or expired token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        Utilisateur current = opt.get();
        if (current.getTypeUtilisateur() == null || !"Manager".equals(current.getTypeUtilisateur().getLibelle())) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Access restricted to managers");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
        
        Optional<PrixMCarree> prix = prixMCarreeService.getPrixAtDate(date);
        
        if (prix.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Aucun prix trouvé pour la date spécifiée");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", prix.get());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/prix-m-carree
     * Ajoute un nouveau prix m²
     */
    @Operation(
        summary = "Ajouter un nouveau prix m²",
        description = "Permet d'ajouter un nouveau prix au mètre carré avec une date de changement. Accès réservé aux managers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Prix créé avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PrixMCarree.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Token manquant ou invalide"),
        @ApiResponse(responseCode = "403", description = "Accès réservé aux managers")
    })
    @PostMapping
    public ResponseEntity<Map<String, Object>> ajouterPrix(
            @Parameter(description = "Header Authorization Bearer <token>")
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "Informations du nouveau prix m²", required = true)
            @RequestBody PrixMCarree prixMCarree) {
        
        // Vérification du token
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String token = authorization.substring("Bearer ".length());
        Optional<Utilisateur> opt = sessionService.getUtilisateurByToken(token);
        if (opt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid or expired token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        Utilisateur current = opt.get();
        if (current.getTypeUtilisateur() == null || !"Manager".equals(current.getTypeUtilisateur().getLibelle())) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Access restricted to managers");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
        
        try {
            PrixMCarree nouveauPrix = prixMCarreeService.ajouterPrix(prixMCarree);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Prix ajouté avec succès");
            response.put("data", nouveauPrix);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Erreur lors de l'ajout du prix: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}
