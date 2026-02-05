package com.signalement.controller;

import com.signalement.entity.Entreprise;
import com.signalement.service.EntrepriseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/enterprises")
@RequiredArgsConstructor
@Slf4j
public class EntrepriseController {

    private final EntrepriseService entrepriseService;

    /**
     * Récupérer tous les entreprises
     */
    @GetMapping
    public ResponseEntity<List<Entreprise>> getAllEntreprises() {
        try {
            log.info("Récupération de toutes les entreprises");
            List<Entreprise> entreprises = entrepriseService.getAllEntreprises();
            return ResponseEntity.ok(entreprises);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des entreprises:", e);
            return ResponseEntity.status(500).build();
        }
    }
}
