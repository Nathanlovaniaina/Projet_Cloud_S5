package com.signalement.controller;

import com.signalement.dto.*;
import com.signalement.entity.EntrepriseConcerner;
import com.signalement.entity.Signalement;
import com.signalement.entity.Session;
import com.signalement.entity.Utilisateur;
import com.signalement.service.SessionService;
import com.signalement.service.SignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@Tag(name = "Manager - Signalements", description = "API de gestion avancée des signalements (réservée aux Managers)")
@SecurityRequirement(name = "bearerAuth")
public class ManagerSignalementController {

    private final SessionService sessionService;
    private final SignalementService signalementService;

    /**
     * Valider que l'utilisateur est un Manager (type = 2)
     */
    private Utilisateur validateManagerAccess(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("Token manquant ou invalide");
        }

        String actualToken = token.substring(7);
        Session session = sessionService.getSessionByToken(actualToken)
                .orElseThrow(() -> new RuntimeException("Session invalide"));

        Utilisateur user = session.getUtilisateur();
        if (user == null) {
            throw new RuntimeException("Utilisateur introuvable");
        }

        if (user.getTypeUtilisateur() == null || user.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
            throw new RuntimeException("Accès réservé aux Managers");
        }

        return user;
    }

    @Operation(
        summary = "Liste tous les signalements (Manager)",
        description = "Retourne une liste paginée et filtrée de tous les signalements. Accès réservé aux Managers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès"),
        @ApiResponse(responseCode = "401", description = "Non autorisé"),
        @ApiResponse(responseCode = "403", description = "Accès interdit - Réservé aux Managers")
    })
    @GetMapping("/signalements")
    public ResponseEntity<com.signalement.dto.ApiResponse> getAllSignalementsForManager(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer etat,
            @RequestParam(required = false) Integer type) {
        try {
            validateManagerAccess(token);

            // Validation
            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            // Récupérer tous les signalements avec filtres
            List<SignalementDTO> allSignalements = signalementService.getAllSignalementsDtoWithFilters(etat, type);

            // Calculer pagination
            int total = allSignalements.size();
            int startIndex = (page - 1) * limit;
            int endIndex = Math.min(startIndex + limit, total);

            List<SignalementDTO> paginatedItems = startIndex < total
                    ? allSignalements.subList(startIndex, endIndex)
                    : java.util.Collections.emptyList();

            // Créer réponse avec métadonnées de pagination
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("items", paginatedItems);
            response.put("total", total);
            response.put("page", page);
            response.put("limit", limit);
            response.put("totalPages", (int) Math.ceil((double) total / limit));

            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Liste récupérée", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new com.signalement.dto.ApiResponse(false, "Erreur serveur: " + e.getMessage()));
        }
    }

    @Operation(
        summary = "Détails complets d'un signalement (Manager)",
        description = "Retourne les détails complets d'un signalement avec historique et assignations"
    )
    @GetMapping("/signalements/{id}")
    public ResponseEntity<com.signalement.dto.ApiResponse> getSignalementDetails(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id) {
        try {
            validateManagerAccess(token);
            SignalementDetailsDTO details = signalementService.getSignalementDetails(id);
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Détails récupérés", details));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Créer un signalement (Manager)",
        description = "Créer un nouveau signalement"
    )
    @PostMapping("/signalements")
    public ResponseEntity<com.signalement.dto.ApiResponse> createSignalement(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody CreateSignalementRequest request) {
        try {
            Utilisateur manager = validateManagerAccess(token);
            Signalement created = signalementService.createSignalementForUser(request, manager);
            SignalementDTO dto = signalementService.convertToEnrichedDTO(created);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new com.signalement.dto.ApiResponse(true, "Signalement créé", dto));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Modifier un signalement (Manager)",
        description = "Mettre à jour les informations d'un signalement"
    )
    @PutMapping("/signalements/{id}")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateSignalement(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSignalementRequest request) {
        try {
            Utilisateur manager = validateManagerAccess(token);
            Signalement updated = signalementService.updateSignalement(id, request, manager);
            SignalementDTO dto = signalementService.convertToEnrichedDTO(updated);
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Signalement modifié", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (IllegalAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Supprimer un signalement (Manager)",
        description = "Supprimer définitivement un signalement"
    )
    @DeleteMapping("/signalements/{id}")
    public ResponseEntity<com.signalement.dto.ApiResponse> deleteSignalement(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id) {
        try {
            validateManagerAccess(token);
            signalementService.deleteSignalement(id);
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Signalement supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new com.signalement.dto.ApiResponse(false, "Erreur lors de la suppression"));
        }
    }

    @Operation(
        summary = "Assigner une entreprise à un signalement (Manager)",
        description = "Créer une nouvelle assignation d'entreprise"
    )
    @PostMapping("/signalements/{id}/assign-enterprise")
    public ResponseEntity<com.signalement.dto.ApiResponse> assignEnterprise(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id,
            @Valid @RequestBody AssignEnterpriseRequest request) {
        try {
            Utilisateur manager = validateManagerAccess(token);
            EntrepriseConcerner assignation = signalementService.assignEnterpriseToSignalement(id, request, manager);
            EntrepriseConcernerDTO dto = signalementService.convertToDTO(assignation);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new com.signalement.dto.ApiResponse(true, "Entreprise assignée", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (IllegalAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Modifier le statut d'une assignation (Manager)",
        description = "Changer le statut d'assignation d'une entreprise"
    )
    @PatchMapping("/signalements/{signalementId}/assign-enterprise/{enterpriseId}/status")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateAssignmentStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer signalementId,
            @PathVariable Integer enterpriseId,
            @Valid @RequestBody UpdateAssignmentStatusRequest request) {
        try {
            Utilisateur manager = validateManagerAccess(token);
            EntrepriseConcerner updated = signalementService.updateAssignmentStatus(signalementId, enterpriseId, request, manager);
            EntrepriseConcernerDTO dto = signalementService.convertToDTO(updated);
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Statut d'assignation modifié", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (IllegalAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Modifier l'état d'un signalement (Manager)",
        description = "Changer l'état global du signalement avec validation des règles métier"
    )
    @PatchMapping("/signalements/{id}/status")
    public ResponseEntity<com.signalement.dto.ApiResponse> updateSignalementStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSignalementStatusRequest request) {
        try {
            Utilisateur manager = validateManagerAccess(token);
            Signalement updated = signalementService.updateSignalementStatus(id, request.getEtatId(), request.getDateChangement(), manager);
            SignalementDTO dto = signalementService.convertToEnrichedDTO(updated);
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "État modifié", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (IllegalAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Récupérer l'historique complet (Manager)",
        description = "Retourne l'historique détaillé des états et assignations"
    )
    @GetMapping("/signalements/{id}/history")
    public ResponseEntity<com.signalement.dto.ApiResponse> getSignalementHistory(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id) {
        try {
            validateManagerAccess(token);
            SignalementDetailsDTO details = signalementService.getSignalementDetails(id);
            
            Map<String, Object> history = new java.util.HashMap<>();
            history.put("historiqueEtat", details.getHistoriqueEtat());
            history.put("assignations", details.getAssignations());
            
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Historique récupéré", history));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(
        summary = "Récupérer les assignations d'un signalement (Manager)",
        description = "Retourne la liste des entreprises assignées à un signalement"
    )
    @GetMapping("/signalements/{id}/assignations")
    public ResponseEntity<com.signalement.dto.ApiResponse> getAssignations(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer id) {
        try {
            validateManagerAccess(token);
            List<EntrepriseConcernerDTO> assignations = signalementService.getAssignationsBySignalement(id);
            return ResponseEntity.ok(new com.signalement.dto.ApiResponse(true, "Assignations récupérées", assignations));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new com.signalement.dto.ApiResponse(false, e.getMessage()));
        }
    }
}
