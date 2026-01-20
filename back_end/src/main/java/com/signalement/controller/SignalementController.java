package com.signalement.controller;

import com.signalement.dto.SignalementDTO;
import com.signalement.entity.Utilisateur;
import com.signalement.service.SessionService;
import com.signalement.service.SignalementService;
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
public class SignalementController {

    private final SessionService sessionService;
    private final SignalementService signalementService;

    @GetMapping("/me/signalements")
    public ResponseEntity<?> getMySignalements(HttpServletRequest request) {
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
