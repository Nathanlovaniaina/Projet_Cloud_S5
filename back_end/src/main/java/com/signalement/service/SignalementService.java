package com.signalement.service;

import com.signalement.dto.CreateSignalementRequest;
import com.signalement.dto.UpdateSignalementRequest;
import com.signalement.entity.EtatSignalement;
import com.signalement.entity.HistoriqueEtatSignalement;
import com.signalement.entity.Signalement;
import com.signalement.entity.TypeTravail;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.EtatSignalementRepository;
import com.signalement.repository.HistoriqueEtatSignalementRepository;
import com.signalement.repository.SignalementRepository;
import com.signalement.repository.TypeTravailRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * Seul un manager peut modifier le statut
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
        
        // Create historique entry instead of setting direct FK
        createHistoriqueEtat(signalement, etat);
        
        // Reload signalement to ensure fresh state for DTO conversion
        return signalementRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé avec l'ID: " + id));
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
}
