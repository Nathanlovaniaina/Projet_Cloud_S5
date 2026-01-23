package com.signalement.service;

import com.signalement.dto.*;
import com.signalement.entity.Session;
import com.signalement.entity.TentativeConnexion;
import com.signalement.entity.TypeUtilisateur;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.TentativeConnexionRepository;
import com.signalement.repository.TypeUtilisateurRepository;
import com.signalement.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UtilisateurRepository utilisateurRepository;
    private final TypeUtilisateurRepository typeUtilisateurRepository;
    private final TentativeConnexionRepository tentativeConnexionRepository;
    private final SessionService sessionService;

    private static final int MAX_TENTATIVES = 3;
    private static final int TENTATIVE_WINDOW_MINUTES = 30;
    private static final int SESSION_DURATION_HOURS = 24;

    /**
     * Tâche 11: Inscription (email/pwd)
     */
    @Transactional
    public ApiResponse inscription(InscriptionRequest request) {
        try {
            // Vérifier si l'email existe déjà
            if (utilisateurRepository.existsByEmail(request.getEmail())) {
                return new ApiResponse(false, "Un utilisateur avec cet email existe déjà");
            }

            // Vérifier si le type d'utilisateur existe
            TypeUtilisateur typeUtilisateur = typeUtilisateurRepository.findById(request.getIdTypeUtilisateur())
                    .orElseThrow(() -> new IllegalArgumentException("Type d'utilisateur invalide"));

            // Créer le nouvel utilisateur
            Utilisateur utilisateur = new Utilisateur();
            utilisateur.setNom(request.getNom());
            utilisateur.setPrenom(request.getPrenom());
            utilisateur.setEmail(request.getEmail());
            utilisateur.setMotDePasse(request.getMotDePasse()); // TODO: Hasher le mot de passe
            utilisateur.setTypeUtilisateur(typeUtilisateur);
            utilisateur.setIsBlocked(false);
            // synced field removed from schema

            Utilisateur savedUser = utilisateurRepository.save(utilisateur);

            return new ApiResponse(true, "Inscription réussie", savedUser.getIdUtilisateur());
        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors de l'inscription: " + e.getMessage());
        }
    }

    /**
     * Tâche 12: Authentification (email/pwd)
     * Tâche 13: Gestion des sessions avec durée de vie
     * Tâche 15: Système de limite de tentatives de connexion
     */
    @Transactional
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        try {
            // Récupérer l'utilisateur par email
            Optional<Utilisateur> optUtilisateur = utilisateurRepository.findByEmail(request.getEmail());
            
            if (optUtilisateur.isEmpty()) {
                return new AuthenticationResponse("Email ou mot de passe incorrect");
            }

            Utilisateur utilisateur = optUtilisateur.get();

            // Vérifier si l'utilisateur est bloqué
            if (Boolean.TRUE.equals(utilisateur.getIsBlocked())) {
                return new AuthenticationResponse("Votre compte est bloqué. Veuillez contacter un administrateur.");
            }

            // Vérifier le nombre de tentatives récentes
            if (isUserLockedDueToFailedAttempts(utilisateur)) {
                // Bloquer l'utilisateur
                utilisateur.setIsBlocked(true);
                utilisateurRepository.save(utilisateur);
                return new AuthenticationResponse("Compte bloqué après 3 tentatives échouées. Veuillez contacter un administrateur.");
            }

            // Vérifier le mot de passe
            if (!utilisateur.getMotDePasse().equals(request.getMotDePasse())) {
                // Enregistrer la tentative échouée
                enregistrerTentativeConnexion(utilisateur, false);
                
                // Compter les tentatives échouées récentes
                int tentativesEchouees = countRecentFailedAttempts(utilisateur);
                int tentativesRestantes = MAX_TENTATIVES - tentativesEchouees;
                
                if (tentativesRestantes > 0) {
                    return new AuthenticationResponse(
                        "Email ou mot de passe incorrect. Il vous reste " + tentativesRestantes + " tentative(s)."
                    );
                } else {
                    utilisateur.setIsBlocked(true);
                    utilisateurRepository.save(utilisateur);
                    return new AuthenticationResponse("Compte bloqué après 3 tentatives échouées.");
                }
            }

            // Authentification réussie
            enregistrerTentativeConnexion(utilisateur, true);

            // Créer une session avec durée de vie (Tâche 13)
            Session session = sessionService.createSession(utilisateur, SESSION_DURATION_HOURS);

            // Construire la réponse
            AuthenticationResponse response = new AuthenticationResponse();
            response.setToken(session.getToken());
            response.setIdUtilisateur(utilisateur.getIdUtilisateur());
            response.setNom(utilisateur.getNom());
            response.setPrenom(utilisateur.getPrenom());
            response.setEmail(utilisateur.getEmail());
            response.setTypeUtilisateur(utilisateur.getTypeUtilisateur().getLibelle());
            response.setMessage("Authentification réussie");

            return response;

        } catch (Exception e) {
            return new AuthenticationResponse("Erreur lors de l'authentification: " + e.getMessage());
        }
    }

    /**
     * Tâche 14: Modification des infos utilisateurs
     */
    @Transactional
    public ApiResponse updateUtilisateur(Integer idUtilisateur, UpdateUtilisateurRequest request, String token) {
        try {
            // Vérifier que la session est valide
            Optional<Utilisateur> sessionUser = sessionService.getUtilisateurByToken(token);
            if (sessionUser.isEmpty()) {
                return new ApiResponse(false, "Session invalide ou expirée");
            }

            // Vérifier que l'utilisateur modifie bien son propre compte ou est manager
            Utilisateur currentUser = sessionUser.get();
            if (!currentUser.getIdUtilisateur().equals(idUtilisateur) && 
                !currentUser.getTypeUtilisateur().getLibelle().equals("Manager")) {
                return new ApiResponse(false, "Vous n'avez pas l'autorisation de modifier cet utilisateur");
            }

            // Récupérer l'utilisateur à modifier
            Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

            // Mettre à jour les informations
            if (request.getNom() != null && !request.getNom().isEmpty()) {
                utilisateur.setNom(request.getNom());
            }
            if (request.getPrenom() != null && !request.getPrenom().isEmpty()) {
                utilisateur.setPrenom(request.getPrenom());
            }
            if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                // Vérifier que le nouvel email n'est pas déjà utilisé
                if (!request.getEmail().equals(utilisateur.getEmail()) && 
                    utilisateurRepository.existsByEmail(request.getEmail())) {
                    return new ApiResponse(false, "Cet email est déjà utilisé");
                }
                utilisateur.setEmail(request.getEmail());
            }
            if (request.getMotDePasse() != null && !request.getMotDePasse().isEmpty()) {
                utilisateur.setMotDePasse(request.getMotDePasse()); // TODO: Hasher le mot de passe
            }

            utilisateurRepository.save(utilisateur);
            return new ApiResponse(true, "Informations mises à jour avec succès");

        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors de la mise à jour: " + e.getMessage());
        }
    }

    /**
     * Tâche 16: Déblocage d'utilisateur
     */
    @Transactional
    public ApiResponse debloquerUtilisateur(Integer idUtilisateur, String token) {
        try {
            // Vérifier que la session est valide et que l'utilisateur est un Manager
            Optional<Utilisateur> sessionUser = sessionService.getUtilisateurByToken(token);
            if (sessionUser.isEmpty()) {
                return new ApiResponse(false, "Session invalide ou expirée");
            }

            Utilisateur currentUser = sessionUser.get();
            if (!currentUser.getTypeUtilisateur().getLibelle().equals("Manager")) {
                return new ApiResponse(false, "Seuls les managers peuvent débloquer des utilisateurs");
            }

            // Récupérer l'utilisateur à débloquer
            Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

            // Débloquer l'utilisateur
            utilisateur.setIsBlocked(false);
            utilisateurRepository.save(utilisateur);

            // Supprimer les tentatives de connexion échouées
            LocalDateTime windowStart = LocalDateTime.now().minusMinutes(TENTATIVE_WINDOW_MINUTES);
            List<TentativeConnexion> tentatives = tentativeConnexionRepository
                    .findByUtilisateurAndDateTentativeAfter(utilisateur, windowStart);
            tentativeConnexionRepository.deleteAll(tentatives);

            return new ApiResponse(true, "Utilisateur débloqué avec succès");

        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors du déblocage: " + e.getMessage());
        }
    }

    /**
     * Déconnexion (invalidation de session)
     */
    @Transactional
    public ApiResponse logout(String token) {
        try {
            sessionService.invalidateSession(token);
            return new ApiResponse(true, "Déconnexion réussie");
        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors de la déconnexion: " + e.getMessage());
        }
    }

    /**
     * Vérifier si l'utilisateur doit être bloqué à cause des tentatives échouées
     */
    private boolean isUserLockedDueToFailedAttempts(Utilisateur utilisateur) {
        int recentFailedAttempts = countRecentFailedAttempts(utilisateur);
        return recentFailedAttempts >= MAX_TENTATIVES;
    }

    /**
     * Compter les tentatives de connexion échouées récentes (dans les 30 dernières minutes)
     */
    private int countRecentFailedAttempts(Utilisateur utilisateur) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(TENTATIVE_WINDOW_MINUTES);
        List<TentativeConnexion> tentatives = tentativeConnexionRepository
                .findByUtilisateurAndDateTentativeAfter(utilisateur, windowStart);
        
        return (int) tentatives.stream()
                .filter(t -> !t.getSuccess())
                .count();
    }

    /**
     * Enregistrer une tentative de connexion
     */
    private void enregistrerTentativeConnexion(Utilisateur utilisateur, boolean success) {
        TentativeConnexion tentative = new TentativeConnexion();
        tentative.setUtilisateur(utilisateur);
        tentative.setDateTentative(LocalDateTime.now());
        tentative.setSuccess(success);
        tentativeConnexionRepository.save(tentative);
    }

    /**
     * Obtenir les utilisateurs bloqués (pour les managers)
     */
    @Transactional(readOnly = true)
    public List<UtilisateurBloqueResponse> getUtilisateursBloqués(String token) {
        // Vérifier que l'utilisateur est un Manager
        Optional<Utilisateur> sessionUser = sessionService.getUtilisateurByToken(token);
        if (sessionUser.isEmpty() || 
            !sessionUser.get().getTypeUtilisateur().getLibelle().equals("Manager")) {
            throw new IllegalArgumentException("Accès non autorisé");
        }

        return utilisateurRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsBlocked()))
                .map(u -> new UtilisateurBloqueResponse(
                    u.getIdUtilisateur(),
                    u.getNom(),
                    u.getPrenom(),
                    u.getEmail(),
                    u.getIsBlocked(),
                    u.getTypeUtilisateur().getLibelle()
                ))
                .toList();
    }
}
