package com.signalement.controller;

import com.signalement.dto.ApiResponse;
import com.signalement.dto.SyncResultDTO;
import com.signalement.service.FirebaseSyncService;
import com.signalement.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Tag(name = "Synchronisation", description = "API de synchronisation avec Firebase")
public class SynchronisationController {

    private final FirebaseSyncService syncService;
    private final SessionService sessionService;

    @Operation(
        summary = "Synchroniser depuis Firebase (Tâche 31)",
        description = "Récupère les données modifiées depuis Firebase et les synchronise avec PostgreSQL. Réservé aux managers."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Synchronisation réussie",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResultDTO.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "Non authentifié"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "403", 
            description = "Accès refusé - Réservé aux managers"
        )
    })
    @PostMapping("/from-firebase")
    public ResponseEntity<ApiResponse> syncFromFirebase(
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Authentification requise"));
        }

        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(manager -> {
                // Vérifier que c'est un manager
                if (manager.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Accès refusé - Réservé aux managers"));
                }

                // Lancer la synchronisation
                SyncResultDTO result = syncService.syncFromFirebase();
                
                if (result.isSuccess()) {
                    return ResponseEntity.ok()
                        .body(new ApiResponse(true, result.getMessage(), result));
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse(false, "Erreur lors de la synchronisation: " + result.getError()));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Token invalide")));
    }

    @Operation(
        summary = "Synchroniser vers Firebase (Tâche 32)",
        description = "Envoie les données depuis PostgreSQL vers Firebase (FULL SYNC). Réservé aux managers."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Synchronisation réussie"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "Non authentifié"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "403", 
            description = "Accès refusé"
        )
    })
    @PostMapping("/to-firebase")
    public ResponseEntity<ApiResponse> syncToFirebase(
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Authentification requise"));
        }

        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(manager -> {
                // Vérifier que c'est un manager
                if (manager.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Accès refusé - Réservé aux managers"));
                }

                // Lancer la synchronisation
                SyncResultDTO result = syncService.syncToFirebase();
                
                if (result.isSuccess()) {
                    return ResponseEntity.ok()
                        .body(new ApiResponse(true, result.getMessage(), result));
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse(false, "Erreur lors du FULL SYNC: " + result.getError()));
                }
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Token invalide")));
    }

    @Operation(
        summary = "Synchronisation bidirectionnelle complète",
        description = "Effectue une synchronisation complète: Firebase -> PostgreSQL puis PostgreSQL -> Firebase"
    )
    @PostMapping("/full")
    public ResponseEntity<ApiResponse> fullSync(
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Authentification requise"));
        }

        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
            .map(manager -> {
                if (manager.getTypeUtilisateur().getIdTypeUtilisateur() != 2) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Accès refusé - Réservé aux managers"));
                }

                // 1. Sync depuis Firebase
                SyncResultDTO resultFrom = syncService.syncFromFirebase();
                if (!resultFrom.isSuccess()) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse(false, "Erreur lors de la sync depuis Firebase: " + resultFrom.getError()));
                }

                // 2. Sync vers Firebase
                SyncResultDTO resultTo = syncService.syncToFirebase();
                if (!resultTo.isSuccess()) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse(false, "Erreur lors de la sync vers Firebase: " + resultTo.getError()));
                }

                return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Synchronisation bidirectionnelle réussie", 
                        java.util.Map.of("from_firebase", resultFrom, "to_firebase", resultTo)));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Token invalide")));
    }
}
