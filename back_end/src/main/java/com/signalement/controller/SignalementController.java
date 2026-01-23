package com.signalement.controller;

import com.signalement.dto.CreateSignalementRequest;
import com.signalement.dto.SignalementDTO;
import com.signalement.entity.Signalement;
import com.signalement.entity.Utilisateur;
import com.signalement.service.SessionService;
import com.signalement.service.SignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "API de gestion des signalements de travaux routiers")
public class SignalementController {

    private final SessionService sessionService;
    private final SignalementService signalementService;

    @Operation(
        summary = "Créer un signalement",
        description = "Créer un nouveau signalement de travaux routiers. Authentification requise. L'état initial sera 'En attente'."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Signalement créé avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignalementDTO.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié ou token invalide")
    })
    @PostMapping("/signalements")
    public ResponseEntity<?> createSignalement(
            @Valid @RequestBody CreateSignalementRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
                .map(utilisateur -> {
                    try {
                        Signalement created = signalementService.createSignalementForUser(request, utilisateur);
                        // Convertir en DTO pour éviter les sérialisation issues
                        SignalementDTO dto = convertSignalementToDTO(created);
                        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
                    } catch (IllegalArgumentException e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", e.getMessage());
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                    } catch (IllegalStateException e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Erreur de configuration: " + e.getMessage());
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
                    }
                })
                .orElseGet(() -> {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Token invalide ou expiré");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                });
    }

    private SignalementDTO convertSignalementToDTO(Signalement s) {
        SignalementDTO dto = new SignalementDTO();
        dto.setIdSignalement(s.getIdSignalement());
        dto.setTitre(s.getTitre());
        dto.setDescription(s.getDescription());
        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setDateCreation(s.getDateCreation());
        dto.setUrlPhoto(s.getUrlPhoto());
        dto.setSynced(s.getSynced());
        dto.setLastSync(s.getLastSync());
        
        if (s.getEtatActuel() != null) {
            dto.setEtatActuelId(s.getEtatActuel().getIdEtatSignalement());
            dto.setEtatLibelle(s.getEtatActuel().getLibelle());
        }
        
        if (s.getTypeTravail() != null) {
            dto.setIdTypeTravail(s.getTypeTravail().getIdTypeTravail());
            dto.setTypeTravauxLibelle(s.getTypeTravail().getLibelle());
        }
        
        return dto;
    }

    @Operation(
        summary = "Récupérer tous les signalements",
        description = "Retourne la liste de tous les signalements publics. Peut être filtré par état et/ou type de travail."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des signalements retournée avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignalementDTO.class)))
    })
    @GetMapping("/signalements")
    public ResponseEntity<List<SignalementDTO>> getAllSignalements(
            @Parameter(description = "ID de l'état du signalement pour filtrer (1=En attente, 2=En cours, etc.)")
            @RequestParam(required = false) Integer etat,
            @Parameter(description = "ID du type de travail pour filtrer")
            @RequestParam(required = false) Integer typeTravail) {
        
        List<SignalementDTO> signalements = signalementService.getAllSignalementsDtoWithFilters(etat, typeTravail);
        return ResponseEntity.ok(signalements);
    }

    @Operation(
        summary = "Récupérer mes signalements",
        description = "Retourne la liste de tous les signalements créés par l'utilisateur authentifié. Authentification requise."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des signalements retournée avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignalementDTO.class))),
        @ApiResponse(responseCode = "401", description = "Non authentifié ou token invalide")
    })
    @GetMapping("/me/signalements")
    public ResponseEntity<?> getMySignalements(
            @Parameter(hidden = true) HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        String token = auth.substring(7).trim();
        java.util.Optional<Utilisateur> userOpt = sessionService.getUtilisateurByToken(token);
        if (userOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Token invalide ou expiré");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        List<SignalementDTO> dtos = signalementService.getSignalementsDtoByUtilisateur(userOpt.get());
        return ResponseEntity.ok(dtos);
    }
}
