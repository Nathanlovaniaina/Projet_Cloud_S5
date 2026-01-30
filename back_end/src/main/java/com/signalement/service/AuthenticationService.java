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
import java.util.Map;
import java.util.UUID;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

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

            // Vérifier si le Firebase UID existe déjà (si fourni)
            if (request.getFirebaseUid() != null && !request.getFirebaseUid().isEmpty()) {
                if (utilisateurRepository.existsByFirebaseUid(request.getFirebaseUid())) {
                    return new ApiResponse(false, "Firebase UID déjà associé à un compte");
                }
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
            utilisateur.setFirebaseUid(request.getFirebaseUid()); // Ajouter le Firebase UID
            utilisateur.setTypeUtilisateur(typeUtilisateur);
            utilisateur.setIsBlocked(false);

            Utilisateur savedUser = utilisateurRepository.save(utilisateur);

            return new ApiResponse(true, "Inscription réussie", savedUser.getIdUtilisateur());
        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors de l'inscription: " + e.getMessage());
        }
    }

    /**
     * Inscription via Firebase: vérifie l'idToken, extrait le firebaseUid et crée l'utilisateur en base.
     * Le client envoie un body contenant au moins: idToken, nom, prenom, typeUtilisateur (libelle optionnel), telephone optionnel.
     */
    @Transactional
    public ApiResponse inscriptionWithFirebase(String idToken, Map<String, Object> body) {
        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String firebaseUid = decoded.getUid();
            String email = decoded.getEmail();

            // Vérifications basiques
            if (utilisateurRepository.existsByFirebaseUid(firebaseUid)) {
                return new ApiResponse(false, "Firebase UID déjà associé à un compte");
            }
            if (email != null && utilisateurRepository.existsByEmail(email)) {
                return new ApiResponse(false, "Un utilisateur avec cet email existe déjà");
            }

            String nom = (String) body.getOrDefault("nom", "");
            String prenom = (String) body.getOrDefault("prenom", "");
            String telephone = (String) body.getOrDefault("telephone", null);
            String typeLibelle = (String) body.getOrDefault("typeUtilisateur", "CITOYEN");

            // Trouver le type utilisateur par libelle, ou fallback à l'ID 1
            TypeUtilisateur typeUtilisateur = typeUtilisateurRepository.findByLibelle(typeLibelle)
                    .orElseGet(() -> typeUtilisateurRepository.findById(1).orElse(null));
            if (typeUtilisateur == null) {
                return new ApiResponse(false, "Type d'utilisateur invalide");
            }

            // Créer utilisateur en base. Utiliser le mot de passe fourni si présent, sinon fallback à un placeholder
            Utilisateur utilisateur = new Utilisateur();
            utilisateur.setNom(nom);
            utilisateur.setPrenom(prenom);
            utilisateur.setEmail(email);
            // Use provided motDePasse from client when available (field: "motDePasse"); otherwise generate placeholder
            String providedPassword = null;
            if (body != null && body.containsKey("motDePasse")) {
                Object mp = body.get("motDePasse");
                if (mp instanceof String && !((String) mp).trim().isEmpty()) {
                    providedPassword = (String) mp;
                }
            }
            if (providedPassword != null) {
                utilisateur.setMotDePasse(providedPassword);
            } else {
                // Placeholder password since column non-nullable
                utilisateur.setMotDePasse(UUID.randomUUID().toString().substring(0, 12));
            }
            utilisateur.setFirebaseUid(firebaseUid);
            utilisateur.setTypeUtilisateur(typeUtilisateur);
            utilisateur.setIsBlocked(false);

            Utilisateur saved = utilisateurRepository.save(utilisateur);
            return new ApiResponse(true, "Inscription réussie (Firebase)", saved.getIdUtilisateur());

        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            return new ApiResponse(false, "Erreur de vérification Firebase: " + e.getMessage());
        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors de l'inscription Firebase: " + e.getMessage());
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
     * Authentifier via Firebase idToken : vérifie le token, retrouve l'utilisateur via firebase_uid
     * puis crée une session backend (ou associe le firebase_uid si l'email existe en base).
     */
    @Transactional
    public AuthenticationResponse authenticateWithFirebase(String idToken) {
        try {
            // Vérifier et décoder l'idToken avec Firebase Admin
            com.google.firebase.auth.FirebaseToken decoded = com.google.firebase.auth.FirebaseAuth.getInstance().verifyIdToken(idToken);
            String firebaseUid = decoded.getUid();
            String email = decoded.getEmail();

            // Chercher par firebaseUid
            Utilisateur utilisateur = utilisateurRepository.findByFirebaseUid(firebaseUid);
            if (utilisateur != null) {
                if (Boolean.TRUE.equals(utilisateur.getIsBlocked())) {
                    return new AuthenticationResponse("Votre compte est bloqué. Veuillez contacter un administrateur.");
                }

                // Enregistrer une tentative réussie (optionnel)
                enregistrerTentativeConnexion(utilisateur, true);

                // Créer une session et renvoyer la réponse
                Session session = sessionService.createSession(utilisateur, SESSION_DURATION_HOURS);
                AuthenticationResponse response = new AuthenticationResponse();
                response.setToken(session.getToken());
                response.setIdUtilisateur(utilisateur.getIdUtilisateur());
                response.setNom(utilisateur.getNom());
                response.setPrenom(utilisateur.getPrenom());
                response.setEmail(utilisateur.getEmail());
                response.setTypeUtilisateur(utilisateur.getTypeUtilisateur().getLibelle());
                response.setMessage("Authentification réussie (Firebase)");
                return response;
            }

            // Si non trouvé par firebaseUid, tenter de trouver par email et lier
            Optional<Utilisateur> byEmail = utilisateurRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                Utilisateur exist = byEmail.get();
                // Vérifier qu'il n'existe pas déjà un autre compte avec ce firebaseUid
                if (utilisateurRepository.existsByFirebaseUid(firebaseUid)) {
                    return new AuthenticationResponse("Firebase UID déjà associé à un compte");
                }
                exist.setFirebaseUid(firebaseUid);
                utilisateurRepository.save(exist);

                Session session = sessionService.createSession(exist, SESSION_DURATION_HOURS);
                AuthenticationResponse response = new AuthenticationResponse();
                response.setToken(session.getToken());
                response.setIdUtilisateur(exist.getIdUtilisateur());
                response.setNom(exist.getNom());
                response.setPrenom(exist.getPrenom());
                response.setEmail(exist.getEmail());
                response.setTypeUtilisateur(exist.getTypeUtilisateur().getLibelle());
                response.setMessage("Authentification réussie (Firebase - lien par email)");
                return response;
            }

            return new AuthenticationResponse("Utilisateur non trouvé. Veuillez créer ou lier votre compte.");
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            return new AuthenticationResponse("Erreur de vérification Firebase: " + e.getMessage());
        } catch (Exception e) {
            return new AuthenticationResponse("Erreur lors de l'authentification Firebase: " + e.getMessage());
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
            if (request.getFirebaseUid() != null && !request.getFirebaseUid().isEmpty()) {
                // Vérifier que le nouvel UID n'existe pas
                if (!request.getFirebaseUid().equals(utilisateur.getFirebaseUid()) && 
                    utilisateurRepository.existsByFirebaseUid(request.getFirebaseUid())) {
                    return new ApiResponse(false, "Firebase UID déjà associé à un autre compte");
                }
                utilisateur.setFirebaseUid(request.getFirebaseUid());
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
     * Bloquer un utilisateur (action réservée aux managers)
     */
    @Transactional
    public ApiResponse bloquerUtilisateur(Integer idUtilisateur, String token) {
        try {
            // Vérifier que la session est valide et que l'utilisateur est un Manager
            Optional<Utilisateur> sessionUser = sessionService.getUtilisateurByToken(token);
            if (sessionUser.isEmpty()) {
                return new ApiResponse(false, "Session invalide ou expirée");
            }

            Utilisateur currentUser = sessionUser.get();
            if (!currentUser.getTypeUtilisateur().getLibelle().equals("Manager")) {
                return new ApiResponse(false, "Seuls les managers peuvent bloquer des utilisateurs");
            }

            // Récupérer l'utilisateur à bloquer
            Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

            // Bloquer l'utilisateur
            utilisateur.setIsBlocked(true);
            utilisateurRepository.save(utilisateur);

            // Invalider toutes les sessions actives de cet utilisateur
            sessionService.invalidateSessionsForUser(utilisateur);

            return new ApiResponse(true, "Utilisateur bloqué avec succès");

        } catch (Exception e) {
            return new ApiResponse(false, "Erreur lors du blocage: " + e.getMessage());
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
