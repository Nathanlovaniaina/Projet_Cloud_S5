package com.signalement.controller;

import com.signalement.dto.SignalementDTO;
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
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Collections;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "API de gestion des signalements de travaux routiers")
public class SignalementController {

    private final SessionService sessionService;
    private final SignalementService signalementService;

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
            return ResponseEntity.status(401).body("Missing or invalid Authorization header");
        }
        String token = auth.substring(7).trim();
        return sessionService.getUtilisateurByToken(token)
                .map(utilisateur -> {
                    List<SignalementDTO> dtos = signalementService.getSignalementsDtoByUtilisateur(utilisateur);
                    return ResponseEntity.ok(dtos);
                })
                .orElseGet(() -> ResponseEntity.status(401).body(Collections.<SignalementDTO>emptyList()));
    }
}
