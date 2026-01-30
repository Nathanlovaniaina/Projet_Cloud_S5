package com.signalement.controller;

import com.signalement.entity.Utilisateur;
import com.signalement.service.SessionService;
import com.signalement.repository.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ManagerController {

    private final SessionService sessionService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Liste paginée des utilisateurs (Manager)")
    @GetMapping("/utilisateurs")
    public ResponseEntity<?> getUtilisateurs(
            @Parameter(description = "Header Authorization Bearer <token>")
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String etat,
            @RequestParam(required = false) String type
    ) {
        try {
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid Authorization header"));
            }

            String token = authorization.substring("Bearer ".length());
            Optional<Utilisateur> opt = sessionService.getUtilisateurByToken(token);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired token"));
            }

            Utilisateur current = opt.get();
            if (current.getTypeUtilisateur() == null || !"Manager".equals(current.getTypeUtilisateur().getLibelle())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access restricted to managers"));
            }

            // If no filters, use pageable query
            if ((search == null || search.isEmpty()) && (etat == null || etat.isEmpty()) && (type == null || type.isEmpty())) {
                Page<Utilisateur> p = utilisateurRepository.findAll(PageRequest.of(Math.max(0, page - 1), Math.max(1, limit)));
                List<Map<String, Object>> items = p.getContent().stream().map(this::mapUser).collect(Collectors.toList());
                Map<String, Object> data = new HashMap<>();
                data.put("items", items);
                data.put("total", p.getTotalElements());
                return ResponseEntity.ok(Map.of("data", data));
            }

            // Otherwise load all and filter in-memory (simpler implementation)
            List<Utilisateur> all = utilisateurRepository.findAll();
            Stream<Utilisateur> stream = all.stream();

            if (search != null && !search.isEmpty()) {
                String s = search.toLowerCase();
                stream = stream.filter(u ->
                        (u.getNom() != null && u.getNom().toLowerCase().contains(s)) ||
                        (u.getPrenom() != null && u.getPrenom().toLowerCase().contains(s)) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(s))
                );
            }

            if (etat != null && !etat.isEmpty()) {
                if (etat.equalsIgnoreCase("blocked")) {
                    stream = stream.filter(u -> Boolean.TRUE.equals(u.getIsBlocked()));
                } else if (etat.equalsIgnoreCase("active")) {
                    stream = stream.filter(u -> !Boolean.TRUE.equals(u.getIsBlocked()));
                }
            }

            if (type != null && !type.isEmpty()) {
                String t = type.toLowerCase();
                stream = stream.filter(u -> u.getTypeUtilisateur() != null && u.getTypeUtilisateur().getLibelle() != null && u.getTypeUtilisateur().getLibelle().toLowerCase().contains(t));
            }

            List<Utilisateur> filtered = stream.collect(Collectors.toList());
            int total = filtered.size();
            int fromIndex = Math.max(0, (page - 1) * limit);
            int toIndex = Math.min(total, fromIndex + limit);
            List<Map<String, Object>> items = Collections.emptyList();
            if (fromIndex < toIndex) {
                items = filtered.subList(fromIndex, toIndex).stream().map(this::mapUser).collect(Collectors.toList());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("items", items);
            data.put("total", total);
            return ResponseEntity.ok(Map.of("data", data));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal error"));
        }
    }

    private Map<String, Object> mapUser(Utilisateur u) {
        Map<String, Object> m = new HashMap<>();
        m.put("idUtilisateur", u.getIdUtilisateur());
        m.put("nom", u.getNom());
        m.put("prenom", u.getPrenom());
        m.put("email", u.getEmail());
        m.put("isBlocked", u.getIsBlocked());
        m.put("typeUtilisateur", u.getTypeUtilisateur() != null ? u.getTypeUtilisateur().getLibelle() : null);
        return m;
    }
}
