package com.signalement.service;

import com.signalement.dto.AssignEnterpriseRequest;
import com.signalement.dto.CreateSignalementRequest;
import com.signalement.dto.EntrepriseConcernerDTO;
import com.signalement.dto.UpdateAssignmentStatusRequest;
import com.signalement.dto.UpdateSignalementRequest;
import com.signalement.entity.Entreprise;
import com.signalement.entity.EntrepriseConcerner;
import com.signalement.entity.EtatSignalement;
import com.signalement.entity.HistoriqueEtatSignalement;
import com.signalement.entity.HistoriqueStatutAssignation;
import com.signalement.entity.Signalement;
import com.signalement.entity.StatutAssignation;
import com.signalement.entity.TypeTravail;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.EntrepriseConcernerRepository;
import com.signalement.repository.EntrepriseRepository;
import com.signalement.repository.EtatSignalementRepository;
import com.signalement.repository.HistoriqueEtatSignalementRepository;
import com.signalement.repository.HistoriqueStatutAssignationRepository;
import com.signalement.repository.SignalementRepository;
import com.signalement.repository.StatutAssignationRepository;
import com.signalement.repository.TypeTravailRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final EtatSignalementRepository etatSignalementRepository;
    private final TypeTravailRepository typeTravailRepository;
    private final HistoriqueEtatSignalementRepository historiqueEtatSignalementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final EntrepriseConcernerRepository entrepriseConcernerRepository;
    private final StatutAssignationRepository statutAssignationRepository;
    private final HistoriqueStatutAssignationRepository historiqueStatutAssignationRepository;
    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional(readOnly = true)
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Signalement> getSignalementById(Integer id) {
        return signalementRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Signalement> getSignalementsByUtilisateur(Utilisateur utilisateur) {
        return signalementRepository.findByUtilisateur(utilisateur);
    }

    @Transactional(readOnly = true)
    public List<com.signalement.dto.SignalementDTO> getSignalementsDtoByUtilisateur(Utilisateur utilisateur) {
        return signalementRepository.findByUtilisateur(utilisateur)
                .stream()
                .map(this::convertToEnrichedDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.signalement.dto.SignalementDTO> getAllSignalementsDto() {
        return signalementRepository.findAll()
                .stream()
                .map(this::convertToEnrichedDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.signalement.dto.SignalementDTO> getAllSignalementsDtoWithFilters(Integer etatId, Integer typeTravauxId) {
        List<Signalement> allSignalements = signalementRepository.findAll();
        
        // Filter by état if specified
        if (etatId != null) {
            allSignalements = allSignalements.stream()
                    .filter(s -> {
                        EtatSignalement currentEtat = getCurrentEtat(s.getIdSignalement());
                        return currentEtat != null && currentEtat.getIdEtatSignalement().equals(etatId);
                    })
                    .toList();
        }
        
        // Filter by type if specified
        if (typeTravauxId != null) {
            allSignalements = allSignalements.stream()
                    .filter(s -> s.getTypeTravail() != null && s.getTypeTravail().getIdTypeTravail().equals(typeTravauxId))
                    .toList();
        }
        
        return allSignalements.stream()
                .map(this::convertToEnrichedDTO)
                .toList();
    }

    public com.signalement.dto.SignalementDTO convertToEnrichedDTO(Signalement s) {
        com.signalement.dto.SignalementDTO dto = new com.signalement.dto.SignalementDTO();
        dto.setIdSignalement(s.getIdSignalement());
        dto.setTitre(s.getTitre());
        dto.setDescription(s.getDescription());
        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setSurfaceMetreCarree(s.getSurfaceMetreCarree());
        dto.setDateCreation(s.getDateCreation());
        dto.setUrlPhoto(s.getUrlPhoto());
        // synced and lastSync removed from schema
        
        try {
            // État managed via historique - retrieve current état
            EtatSignalement currentEtat = getCurrentEtat(s.getIdSignalement());
            if (currentEtat != null) {
                dto.setEtatActuelId(currentEtat.getIdEtatSignalement());
                dto.setEtatLibelle(currentEtat.getLibelle());
            }
        } catch (Exception ignored) {}
        
        try {
            if (s.getTypeTravail() != null) {
                dto.setIdTypeTravail(s.getTypeTravail().getIdTypeTravail());
                dto.setTypeTravauxLibelle(s.getTypeTravail().getLibelle());
            }
        } catch (Exception ignored) {}
        
        try {
            if (s.getUtilisateur() != null) {
                dto.setIdUtilisateur(s.getUtilisateur().getIdUtilisateur());
            }
        } catch (Exception ignored) {}
        
        return dto;
    }

    @Transactional
    public Signalement createSignalementForUser(CreateSignalementRequest request, Utilisateur utilisateur) {
        Signalement signalement = new Signalement();
        signalement.setTitre(request.getTitre());
        signalement.setDescription(request.getDescription());
        signalement.setLatitude(request.getLatitude());
        signalement.setLongitude(request.getLongitude());
        signalement.setSurfaceMetreCarree(request.getSurfaceMetreCarree());
        signalement.setUrlPhoto(request.getUrlPhoto());
        signalement.setUtilisateur(utilisateur);
        signalement.setDateCreation(LocalDateTime.now());
        // synced field removed
        
        // Créer le Point géographique PostGIS
        Point point = geometryFactory.createPoint(
            new Coordinate(request.getLongitude().doubleValue(), request.getLatitude().doubleValue())
        );
        signalement.setGeom(point);
        
        // État initial managed via historique - no direct FK
        // Will create historique entry after save
        
        // Type de travail optionnel
        if (request.getIdTypeTravail() != null) {
            TypeTravail typeTravail = typeTravailRepository.findById(request.getIdTypeTravail())
                    .orElseThrow(() -> new IllegalArgumentException("Type de travail non trouvé avec l'ID: " + request.getIdTypeTravail()));
            signalement.setTypeTravail(typeTravail);
        }
        
        Signalement savedSignalement = signalementRepository.save(signalement);
        
        // Create initial historique entry with "En attente" état
        EtatSignalement etatInitial = etatSignalementRepository.findById(1)
                .orElseThrow(() -> new IllegalStateException("État 'En attente' non trouvé"));
        createHistoriqueEtat(savedSignalement, etatInitial);
        
        return savedSignalement;
    }

    @Transactional(readOnly = true)
    public List<Signalement> getSignalementsByEtat(Integer etatId) {
        return signalementRepository.findAll().stream()
                .filter(s -> {
                    EtatSignalement currentEtat = getCurrentEtat(s.getIdSignalement());
                    return currentEtat != null && currentEtat.getIdEtatSignalement().equals(etatId);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Signalement> getSignalementsNearby(Double latitude, Double longitude, Double distanceMeters) {
        return signalementRepository.findSignalementsNearby(latitude, longitude, distanceMeters);
    }

    @Transactional
    public Signalement createSignalement(Signalement signalement) {
        return signalementRepository.save(signalement);
    }

    @Transactional
    public Signalement updateSignalement(Integer id, Signalement signalement) {
        return signalementRepository.findById(id)
                .map(existing -> {
                    existing.setTitre(signalement.getTitre());
                    existing.setDescription(signalement.getDescription());
                    existing.setLatitude(signalement.getLatitude());
                    existing.setLongitude(signalement.getLongitude());
                    // etatActuel managed via historique - use updateSignalementStatus() instead
                    existing.setTypeTravail(signalement.getTypeTravail());
                    existing.setUrlPhoto(signalement.getUrlPhoto());
                    return signalementRepository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé avec l'ID: " + id));
    }

    @Transactional
    public void deleteSignalement(Integer id) {
        signalementRepository.deleteById(id);
    }

    /**
     * Vérifier si un utilisateur est manager (Tâche 22, 23)
     * Un manager a un TypeUtilisateur avec idTypeUtilisateur = 2
     */
    private boolean isManager(Utilisateur utilisateur) {
        return utilisateur.getTypeUtilisateur() != null 
            && utilisateur.getTypeUtilisateur().getIdTypeUtilisateur() == 2;
    }

    /**
     * Modifier un signalement (Tâche 22)
     * Seul le créateur ou un manager peut modifier
     */
    @Transactional
    public Signalement updateSignalement(Integer id, UpdateSignalementRequest request, Utilisateur utilisateur) 
            throws IllegalAccessException {
        Signalement signalement = signalementRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé avec l'ID: " + id));
        
        // Vérifier que c'est le créateur ou un manager
        if (!signalement.getUtilisateur().getIdUtilisateur().equals(utilisateur.getIdUtilisateur())
            && !isManager(utilisateur)) {
            throw new IllegalAccessException("Vous n'avez pas le droit de modifier ce signalement");
        }
        
        // Mise à jour des champs
        signalement.setTitre(request.getTitre());
        signalement.setDescription(request.getDescription());
        
        // Mise à jour du type de travail si fourni
        if (request.getIdTypeTravail() != null) {
            TypeTravail typeTravail = typeTravailRepository.findById(request.getIdTypeTravail())
                .orElseThrow(() -> new IllegalArgumentException("Type de travail non trouvé"));
            signalement.setTypeTravail(typeTravail);
        }
        
        signalement.setUrlPhoto(request.getUrlPhoto());
        // synced field removed
        
        return signalementRepository.save(signalement);
    }

    /**
     * Modifier le statut d'un signalement (Tâche 23)
     * AVEC VALIDATION DES RÈGLES MÉTIER (Tâche 29)
     */
    @Transactional
    public Signalement updateSignalementStatus(Integer id, Integer etatId, Utilisateur utilisateur) 
            throws IllegalAccessException {
        // Vérifier que l'utilisateur est manager
        if (!isManager(utilisateur)) {
            throw new IllegalAccessException("Seuls les managers peuvent modifier le statut");
        }
        
        Signalement signalement = signalementRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé avec l'ID: " + id));
        
        EtatSignalement etat = etatSignalementRepository.findById(etatId)
            .orElseThrow(() -> new IllegalArgumentException("État non trouvé avec l'ID: " + etatId));
        
        // ✅ NOUVELLE VALIDATION MÉTIER (Tâche 29)
        canTransitionToState(id, etatId);
        
        // Create historique entry instead of setting direct FK
        createHistoriqueEtat(signalement, etat);
        
        // Reload signalement to ensure fresh state for DTO conversion
        return signalementRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé avec l'ID: " + id));
    }
    
    /**
     * Vérifier si un signalement peut passer à un nouvel état
     * En fonction des assignations d'entreprises (Tâche 29)
     */
    private void canTransitionToState(Integer signalementId, Integer newStateId) throws IllegalArgumentException {
        // ID 2 = "En cours"
        if (newStateId == 2) {
            // Vérifier qu'il existe au moins une assignation acceptée (ID 2)
            List<EntrepriseConcerner> assignations = entrepriseConcernerRepository
                .findBySignalement_IdSignalement(signalementId);
            
            boolean hasAcceptedAssignment = assignations.stream()
                .anyMatch(a -> a.getStatutAssignation() != null && 
                              a.getStatutAssignation().getIdStatutAssignation() == 2);
            
            if (!hasAcceptedAssignment) {
                throw new IllegalArgumentException(
                    "Impossible de mettre le signalement en 'En cours'. " +
                    "Au moins une entreprise doit avoir accepté le projet."
                );
            }
        }
        
        // ID 3 = "Résolu" (Terminé)
        if (newStateId == 3) {
            // Vérifier qu'il existe au moins une assignation en cours (ID 4) ou terminée (ID 5)
            List<EntrepriseConcerner> assignations = entrepriseConcernerRepository
                .findBySignalement_IdSignalement(signalementId);
            
            boolean hasActiveAssignment = assignations.stream()
                .anyMatch(a -> a.getStatutAssignation() != null && 
                              (a.getStatutAssignation().getIdStatutAssignation() == 4 ||
                               a.getStatutAssignation().getIdStatutAssignation() == 5));
            
            if (!hasActiveAssignment) {
                throw new IllegalArgumentException(
                    "Impossible de mettre le signalement en 'Résolu'. " +
                    "Au moins une entreprise doit avoir commencé ou terminé les travaux."
                );
            }
        }
    }
    
    /**
     * Récupérer toutes les assignations d'un signalement (Tâche 30)
     */
    @Transactional(readOnly = true)
    public List<EntrepriseConcernerDTO> getAssignationsBySignalement(Integer signalementId) {
        // Vérifier que le signalement existe
        Signalement signalement = signalementRepository.findById(signalementId)
            .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé"));
        
        // Récupérer toutes les assignations
        List<EntrepriseConcerner> assignations = entrepriseConcernerRepository
            .findBySignalement_IdSignalement(signalementId);
        
        // Convertir en DTOs
        return assignations.stream()
            .map(this::convertToDTO)
            .toList();
    }
    
    // Helper methods for historique-based état management
    
    private void createHistoriqueEtat(Signalement signalement, EtatSignalement etat) {
        HistoriqueEtatSignalement historique = new HistoriqueEtatSignalement();
        historique.setSignalement(signalement);
        historique.setEtatSignalement(etat);
        historique.setDateChangement(LocalDateTime.now());
        historiqueEtatSignalementRepository.save(historique);
    }
    
    private EtatSignalement getCurrentEtat(Integer signalementId) {
        // Get all historique entries for this signalement, ordered by most recent first
        List<HistoriqueEtatSignalement> historiques = historiqueEtatSignalementRepository
                .findBySignalement_IdSignalementOrderByDateChangementDesc(signalementId);
        
        // Return the current état (the most recent one)
        if (!historiques.isEmpty()) {
            return historiques.get(0).getEtatSignalement();
        }
        return null;
    }
    
    // ===== TÂCHE 27 =====
    /**
     * Assigner un signalement à une entreprise (Tâche 27)
     * Seul un manager peut assigner
     */
    @Transactional
    public EntrepriseConcerner assignEnterpriseToSignalement(
            Integer signalementId, 
            AssignEnterpriseRequest request, 
            Utilisateur manager) 
            throws IllegalAccessException {
        
        // Vérifier que l'utilisateur est manager
        if (!isManager(manager)) {
            throw new IllegalAccessException("Seuls les managers peuvent assigner des entreprises");
        }
        
        // Récupérer le signalement
        Signalement signalement = signalementRepository.findById(signalementId)
            .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé"));
        
        // Récupérer l'entreprise
        Entreprise entreprise = entrepriseRepository.findById(request.getIdEntreprise())
            .orElseThrow(() -> new IllegalArgumentException("Entreprise non trouvée"));
        
        // Récupérer le statut d'assignation par défaut (EN ATTENTE = ID 1)
        StatutAssignation statut = statutAssignationRepository.findById(1)
            .orElseThrow(() -> new IllegalArgumentException("Statut d'assignation 'En attente' non trouvé"));
        
        // Valider les dates
        if (request.getDateDebut().isAfter(request.getDateFin())) {
            throw new IllegalArgumentException("La date de début doit être avant la date de fin");
        }
        
        // Créer l'assignation
        EntrepriseConcerner assignation = new EntrepriseConcerner();
        assignation.setSignalement(signalement);
        assignation.setEntreprise(entreprise);
        assignation.setStatutAssignation(statut);
        assignation.setDateCreation(LocalDate.now());
        assignation.setDateDebut(request.getDateDebut());
        assignation.setDateFin(request.getDateFin());
        assignation.setMontant(request.getMontant());
        assignation.setLastUpdate(LocalDateTime.now());
        
        EntrepriseConcerner saved = entrepriseConcernerRepository.save(assignation);
        
        // Créer un historique de l'assignation
        createHistoriqueStatusAssignation(saved, statut);
        
        return saved;
    }

    // ===== TÂCHE 28 =====
    /**
     * Modifier le statut d'une assignation entreprise (Tâche 28)
     * Seul un manager peut modifier
     */
    @Transactional
    public EntrepriseConcerner updateAssignmentStatus(
            Integer signalementId,
            Integer enterpriseId,
            UpdateAssignmentStatusRequest request,
            Utilisateur manager)
            throws IllegalAccessException {
        
        // Vérifier que l'utilisateur est manager
        if (!isManager(manager)) {
            throw new IllegalAccessException("Seuls les managers peuvent modifier le statut d'assignation");
        }
        
        // Récupérer l'assignation
        EntrepriseConcerner assignation = entrepriseConcernerRepository
            .findBySignalement_IdSignalementAndEntreprise_IdEntreprise(signalementId, enterpriseId)
            .orElseThrow(() -> new IllegalArgumentException("Assignation non trouvée"));
        
        // Récupérer le nouveau statut
        StatutAssignation nouveauStatut = statutAssignationRepository.findById(request.getIdStatutAssignation())
            .orElseThrow(() -> new IllegalArgumentException("Statut d'assignation non trouvé"));
        
        // Mettre à jour le statut
        assignation.setStatutAssignation(nouveauStatut);
        assignation.setLastUpdate(LocalDateTime.now());
        EntrepriseConcerner updated = entrepriseConcernerRepository.save(assignation);
        
        // Créer un historique du changement
        createHistoriqueStatusAssignation(updated, nouveauStatut);
        
        return updated;
    }

    // Helper method for assignment status history
    private void createHistoriqueStatusAssignation(
            EntrepriseConcerner assignation,
            StatutAssignation statut) {
        HistoriqueStatutAssignation historique = new HistoriqueStatutAssignation();
        historique.setEntrepriseConcerner(assignation);
        historique.setStatutAssignation(statut);
        historique.setDateChangement(LocalDateTime.now());
        historiqueStatutAssignationRepository.save(historique);
    }

    public EntrepriseConcernerDTO convertToDTO(EntrepriseConcerner assignation) {
        EntrepriseConcernerDTO dto = new EntrepriseConcernerDTO();
        dto.setIdEntrepriseConcerner(assignation.getIdEntrepriseConcerner());
        dto.setDateCreation(assignation.getDateCreation());
        dto.setMontant(assignation.getMontant());
        dto.setDateDebut(assignation.getDateDebut());
        dto.setDateFin(assignation.getDateFin());
        dto.setLastUpdate(assignation.getLastUpdate());
        
        if (assignation.getStatutAssignation() != null) {
            dto.setIdStatutAssignation(assignation.getStatutAssignation().getIdStatutAssignation());
            dto.setStatutLibelle(assignation.getStatutAssignation().getLibelle());
        }
        
        if (assignation.getEntreprise() != null) {
            dto.setIdEntreprise(assignation.getEntreprise().getIdEntreprise());
            dto.setNomEntreprise(assignation.getEntreprise().getNomDuCompagnie());
            dto.setEmailEntreprise(assignation.getEntreprise().getEmail());
        }
        
        if (assignation.getSignalement() != null) {
            dto.setIdSignalement(assignation.getSignalement().getIdSignalement());
            dto.setTitreSignalement(assignation.getSignalement().getTitre());
            dto.setDescriptionSignalement(assignation.getSignalement().getDescription());
        }
        
        return dto;
    }
}

