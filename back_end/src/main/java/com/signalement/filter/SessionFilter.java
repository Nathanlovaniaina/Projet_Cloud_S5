package com.signalement.filter;

import com.signalement.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
@Order(1)
public class SessionFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(SessionFilter.class);

    private final SessionService sessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Allow unauthenticated endpoints (login, public resources) and API/docs
        if (path.contains("/api/auth/")
            || path.startsWith("/api/public")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/swagger")
            || path.startsWith("/swagger-ui")
            || path.equals("/swagger-ui.html")
            || "OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // GET /api/signalements is public (no auth required for retrieving all)
        if ("GET".equalsIgnoreCase(method) && path.equals("/api/signalements")) {
            filterChain.doFilter(request, response);
            return;
        }

        // GET /api/signalements/visiteur should be public for the visitor page
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/signalements/visiteur")) {
            filterChain.doFilter(request, response);
            return;
        }
        // GET /api/signalements/etats, /types and public stats endpoints should be public
        if ("GET".equalsIgnoreCase(method) && (
            path.startsWith("/api/signalements/etats") 
            || path.startsWith("/api/signalements/types")
            || path.startsWith("/api/signalements/summary-public")
            || path.startsWith("/api/signalements/stats-by-type-public")
            || path.startsWith("/api/signalements/stats-by-state-public")
        )) {
            filterChain.doFilter(request, response);
            return;
        }
        // GET /api/signalements/{id}/assignations is public (no auth required)
        if ("GET".equalsIgnoreCase(method) && path.contains("/assignations")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Vérifier le header Authorization pour les autres routes
        String header = request.getHeader("Authorization");
        if (header == null || header.isEmpty()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return;
        }

        // Le token peut être avec ou sans "Bearer "
        String token = header.startsWith("Bearer ") ? header.substring(7) : header;
        
        if (!sessionService.isSessionValid(token)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Session invalid or expired");
            return;
        }

        // Continue the chain if session is valid
        filterChain.doFilter(request, response);
    }
}
