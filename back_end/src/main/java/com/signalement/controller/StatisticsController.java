package com.signalement.controller;

import com.signalement.dto.ApiResponse;
import com.signalement.dto.StatisticsDTO;
import com.signalement.entity.Session;
import com.signalement.entity.TypeUtilisateur;
import com.signalement.service.SessionService;
import com.signalement.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Tag(name = "Statistiques", description = "API de gestion des statistiques système")
@SecurityRequirement(name = "bearerAuth")
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final SessionService sessionService;

    /**
     * Valide qu'un utilisateur est un manager (type = 2)
     */
    private void validateManagerAccess(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("Token invalide ou manquant");
        }

        String actualToken = token.substring(7);
        Session session = sessionService.getSessionByToken(actualToken)
                .orElseThrow(() -> new RuntimeException("Session invalide"));

        if (session.getUtilisateur() == null) {
            throw new RuntimeException("Session invalide");
        }

        TypeUtilisateur typeUtilisateur = session.getUtilisateur().getTypeUtilisateur();
        if (typeUtilisateur == null || typeUtilisateur.getIdTypeUtilisateur() != 2) {
            throw new RuntimeException("Accès refusé : réservé aux managers");
        }
    }

    /**
     * Récupère les statistiques globales (dashboard principal)
     */
    @GetMapping("/summary")
    @Operation(
            summary = "Récupère les statistiques globales",
            description = "Retourne un récapitulatif complet des statistiques système (signalements, utilisateurs, entreprises, taux moyens). Accès réservé aux managers."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistiques récupérées avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non autorisé - Token invalide ou manquant"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès interdit - Réservé aux managers"
            )
    })
    public ResponseEntity<ApiResponse> getSummaryStatistics(
            @RequestHeader("Authorization") String token
    ) {
        try {
            validateManagerAccess(token);
            StatisticsDTO stats = statisticsService.getSummaryStatistics();
            return ResponseEntity.ok(new ApiResponse(true, "Statistiques globales récupérées avec succès", stats));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Erreur lors de la récupération des statistiques: " + e.getMessage(), null));
        }
    }

    /**
     * Récupère les statistiques par type de travail
     */
    @GetMapping("/by-work-type")
    @Operation(
            summary = "Récupère les statistiques par type de travail",
            description = "Retourne la répartition des signalements par type de travail avec détails par état. Accès réservé aux managers."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistiques par type récupérées avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non autorisé - Token invalide"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès interdit - Réservé aux managers"
            )
    })
    public ResponseEntity<ApiResponse> getStatisticsByWorkType(
            @RequestHeader("Authorization") String token
    ) {
        try {
            validateManagerAccess(token);
            List<StatisticsDTO.TypeTravailStatDTO> stats = statisticsService.getStatisticsByWorkType();
            return ResponseEntity.ok(new ApiResponse(true, "Statistiques par type de travail récupérées avec succès", stats));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Erreur lors de la récupération des statistiques: " + e.getMessage(), null));
        }
    }

    /**
     * Récupère les statistiques par état
     */
    @GetMapping("/by-state")
    @Operation(
            summary = "Récupère les statistiques par état",
            description = "Retourne la répartition des signalements par état avec pourcentages. Accès réservé aux managers."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistiques par état récupérées avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non autorisé - Token invalide"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès interdit - Réservé aux managers"
            )
    })
    public ResponseEntity<ApiResponse> getStatisticsByState(
            @RequestHeader("Authorization") String token
    ) {
        try {
            validateManagerAccess(token);
            List<StatisticsDTO.EtatStatDTO> stats = statisticsService.getStatisticsByState();
            return ResponseEntity.ok(new ApiResponse(true, "Statistiques par état récupérées avec succès", stats));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Erreur lors de la récupération des statistiques: " + e.getMessage(), null));
        }
    }

    /**
     * Récupère les statistiques par entreprise
     */
    @GetMapping("/by-enterprise")
    @Operation(
            summary = "Récupère les statistiques par entreprise",
            description = "Retourne les métriques de performance de toutes les entreprises (tâches assignées, terminées, taux de complétion, ponctualité). Accès réservé aux managers."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistiques par entreprise récupérées avec succès"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Non autorisé - Token invalide"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Accès interdit - Réservé aux managers"
            )
    })
    public ResponseEntity<ApiResponse> getStatisticsByEnterprise(
            @RequestHeader("Authorization") String token
    ) {
        try {
            validateManagerAccess(token);
            List<StatisticsDTO.EntreprisePerformanceDTO> stats = statisticsService.getEnterpriseStatistics();
            return ResponseEntity.ok(new ApiResponse(true, "Statistiques par entreprise récupérées avec succès", stats));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Erreur lors de la récupération des statistiques: " + e.getMessage(), null));
        }
    }
}
