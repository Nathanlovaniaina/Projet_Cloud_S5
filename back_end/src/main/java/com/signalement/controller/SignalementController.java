package com.signalement.controller;

import com.signalement.dto.AssignEnterpriseRequest;
import com.signalement.dto.CreateSignalementRequest;
import com.signalement.dto.EntrepriseConcernerDTO;
import com.signalement.dto.SignalementDTO;
import com.signalement.dto.UpdateAssignmentStatusRequest;
import com.signalement.dto.UpdateSignalementRequest;
import com.signalement.dto.UpdateSignalementStatusRequest;
import com.signalement.entity.EntrepriseConcerner;
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

import java.util.List;

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
    public ResponseEntity<com.signalement.dto.ApiResponse> createSignalement(
            @Valid @RequestBody CreateSignalementRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Authentification requise"));
        }
        
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
                .map(utilisateur -> {
                    try {
                        Signalement created = signalementService.createSignalementForUser(request, utilisateur);
                        SignalementDTO dto = convertSignalementToDTO(created);
                        return ResponseEntity.status(HttpStatus.CREATED)
                            .body(new com.signalement.dto.ApiResponse(true, "Signalement créé avec succès", dto));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                    } catch (IllegalStateException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new com.signalement.dto.ApiResponse(false, "Erreur de configuration: " + e.getMessage()));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new com.signalement.dto.ApiResponse(false, "Token invalide ou expiré")));
    }

    private SignalementDTO convertSignalementToDTO(Signalement s) {
        SignalementDTO dto = new SignalementDTO();
        dto.setIdSignalement(s.getIdSignalement());
        dto.setTitre(s.getTitre());
        dto.setDescription(s.getDescription());
        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setSurfaceMetreCarree(s.getSurfaceMetreCarree());
        dto.setDateCreation(s.getDateCreation());
        dto.setUrlPhoto(s.getUrlPhoto());
        // synced and lastSync removed from schema
        
        // État managed via historique - will be set by service layer
        // if (s.getEtatActuel() != null) {
        //     dto.setEtatActuelId(s.getEtatActuel().getIdEtatSignalement());
        //     dto.setEtatLibelle(s.getEtatActuel().getLibelle());
        // }
        
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
    public ResponseEntity<com.signalement.dto.ApiResponse> getAllSignalements(
            @Parameter(description = "ID de l'état du signalement pour filtrer (1=En attente, 2=En cours, etc.)")
            @RequestParam(required = false) Integer etat,
            @Parameter(description = "ID du type de travail pour filtrer")
            @RequestParam(required = false) Integer typeTravail) {
        
        List<SignalementDTO> signalements = signalementService.getAllSignalementsDtoWithFilters(etat, typeTravail);
        return ResponseEntity.ok(
            new com.signalement.dto.ApiResponse(true, "Liste des signalements récupérée avec succès", signalements));
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
    public ResponseEntity<com.signalement.dto.ApiResponse> getMySignalements(
            @Parameter(hidden = true) HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Authentification requise"));
        }
        
        String token = auth.substring(7).trim();
        java.util.Optional<Utilisateur> userOpt = sessionService.getUtilisateurByToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Token invalide ou expiré"));
        }
        
        List<SignalementDTO> dtos = signalementService.getSignalementsDtoByUtilisateur(userOpt.get());
        return ResponseEntity.ok(
            new com.signalement.dto.ApiResponse(true, "Vos signalements récupérés avec succès", dtos));
    }

    @Operation(
        summary = "Modifier un signalement (Tâche 22)",
        description = "Modifier les informations d'un signalement. Seul le créateur ou un manager peut le faire."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Signalement modifié avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignalementDTO.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Pas de permission"),
        @ApiResponse(responseCode = "404", description = "Signalement non trouvé")
    })
    @PutMapping("/signalements/{id}")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateSignalement(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSignalementRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Authentification requise"));
        }
        
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(utilisateur -> {
                try {
                    Signalement updated = signalementService.updateSignalement(id, request, utilisateur);
                    com.signalement.dto.SignalementDTO dto = signalementService.convertToEnrichedDTO(updated);
                    return ResponseEntity.ok(
                        new com.signalement.dto.ApiResponse(true, "Signalement modifié avec succès", dto));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                } catch (IllegalAccessException e) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Token invalide")));
    }

    @Operation(
        summary = "Modifier le statut d'un signalement (Tâche 23)",
        description = "Modifier l'état d'un signalement (En attente, En cours, Résolu, Rejeté). Réservé aux managers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statut modifié avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignalementDTO.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Pas manager"),
        @ApiResponse(responseCode = "404", description = "Signalement ou état non trouvé")
    })
    @PatchMapping("/signalements/{id}/status")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateSignalementStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSignalementStatusRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Authentification requise"));
        }
        
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(utilisateur -> {
                try {
                    Signalement updated = signalementService.updateSignalementStatus(id, request.getEtatId(), utilisateur);
                    com.signalement.dto.SignalementDTO dto = signalementService.convertToEnrichedDTO(updated);
                    return ResponseEntity.ok(
                        new com.signalement.dto.ApiResponse(true, "Statut modifié avec succès", dto));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                } catch (IllegalAccessException e) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Token invalide")));
    }
    
    @Operation(
        summary = "Assigner un signalement à une entreprise (Tâche 27)",
        description = "Assigner un signalement à une entreprise avec dates et montant. Seul un manager peut effectuer cette action."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Assignation créée avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntrepriseConcernerDTO.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Pas manager"),
        @ApiResponse(responseCode = "404", description = "Signalement ou entreprise non trouvé")
    })
    @PostMapping("/signalements/{id}/assign-enterprise")
    public ResponseEntity<com.signalement.dto.ApiResponse> assignEnterpriseToSignalement(
            @PathVariable Integer id,
            @Valid @RequestBody AssignEnterpriseRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Authentification requise"));
        }
        
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(manager -> {
                try {
                    EntrepriseConcerner assignation = signalementService.assignEnterpriseToSignalement(id, request, manager);
                    EntrepriseConcernerDTO dto = signalementService.convertToDTO(assignation);
                    return ResponseEntity.status(HttpStatus.CREATED)
                        .body(new com.signalement.dto.ApiResponse(true, "Assignation créée avec succès", dto));
                } catch (IllegalAccessException e) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Token invalide")));
    }
    
    @Operation(
        summary = "Modifier le statut d'une assignation entreprise (Tâche 28)",
        description = "Modifier le statut d'une assignation (EN ATTENTE, ACCEPTÉE, REJETÉE, TERMINÉE, EN COURS). Seul un manager peut effectuer cette action."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statut modifié avec succès",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntrepriseConcernerDTO.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Pas manager"),
        @ApiResponse(responseCode = "404", description = "Assignation ou statut non trouvé")
    })
    @PatchMapping("/signalements/{id}/enterprise-assignment-status")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateAssignmentStatus(
            @PathVariable Integer id,
            @RequestParam(required = true) Integer enterpriseId,
            @Valid @RequestBody UpdateAssignmentStatusRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Authentification requise"));
        }
        
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(manager -> {
                try {
                    EntrepriseConcerner updated = signalementService.updateAssignmentStatus(id, enterpriseId, request, manager);
                    EntrepriseConcernerDTO dto = signalementService.convertToDTO(updated);
                    return ResponseEntity.ok(
                        new com.signalement.dto.ApiResponse(true, "Statut modifié avec succès", dto));
                } catch (IllegalAccessException e) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new com.signalement.dto.ApiResponse(false, "Token invalide")));
    }
}
