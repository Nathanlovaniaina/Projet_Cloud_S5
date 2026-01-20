package com.signalement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class TestTokenController {

    private static final String VALID_TOKEN = "11111111-1111-1111-1111-111111111111";
    private static final String EXPIRED_TOKEN = "22222222-2222-2222-2222-222222222222";

    @GetMapping("/protected")
    public ResponseEntity<String> protectedEndpoint(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || auth.isEmpty() || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Missing or invalid Authorization header");
        }
        String token = auth.substring(7).trim();
        if (VALID_TOKEN.equals(token)) {
            return ResponseEntity.ok("Access granted: token valid");
        } else if (EXPIRED_TOKEN.equals(token)) {
            return ResponseEntity.status(401).body("Token expired");
        } else {
            return ResponseEntity.status(403).body("Forbidden: invalid token");
        }
    }

    @GetMapping("/public")
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("Public endpoint accessible");
    }
}
