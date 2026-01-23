package com.signalement.service;

import com.signalement.dto.CreateSignalementRequest;
import com.signalement.dto.UpdateSignalementRequest;
import com.signalement.entity.EtatSignalement;
import com.signalement.entity.Signalement;
import com.signalement.entity.TypeTravail;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.EtatSignalementRepository;
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
        List<Signalement> signalements;
        
        if (etatId != null && typeTravauxId != null) {
            signalements = signalementRepository.findAll().stream()
                    .filter(s -> s.getEtatActuel() != null && s.getEtatActuel().getIdEtatSignalement().equals(etatId))
                    .filter(s -> s.getTypeTravail() != null && s.getTypeTravail().getIdTypeTravail().equals(typeTravauxId))
                    .toList();
        } else if (etatId != null) {
            signalements = signalementRepository.findByEtatActuel(etatId);
        } else if (typeTravauxId != null) {
            signalements = signalementRepository.findAll().stream()
                    .filter(s -> s.getTypeTravail() != null && s.getTypeTravail().getIdTypeTravail().equals(typeTravauxId))
                    .toList();
        } else {
            signalements = signalementRepository.findAll();
        }
        
        return signalements.stream()
                .map(this::convertToEnrichedDTO)
                .toList();
    }

    private com.signalement.dto.SignalementDTO convertToEnrichedDTO(Signalement s) {
        com.signalement.dto.SignalementDTO dto = new com.signalement.dto.SignalementDTO();
        dto.setIdSignalement(s.getIdSignalement());
        dto.setTitre(s.getTitre());
        dto.setDescription(s.getDescription());
        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setDateCreation(s.getDateCreation());
        dto.setUrlPhoto(s.getUrlPhoto());
        dto.setSynced(s.getSynced());
        dto.setLastSync(s.getLastSync());
        
        try {
            if (s.getEtatActuel() != null) {
                dto.setEtatActuelId(s.getEtatActuel().getIdEtatSignalement());
                dto.setEtatLibelle(s.getEtatActuel().getLibelle());
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
        signalement.setUrlPhoto(request.getUrlPhoto());
        signalement.setUtilisateur(utilisateur);
        signalement.setDateCreation(LocalDateTime.now());
        signalement.setSynced(false);
        
        // Créer le Point géographique PostGIS
        Point point = geometryFactory.createPoint(
            new Coordinate(request.getLongitude().doubleValue(), request.getLatitude().doubleValue())
        );
        signalement.setGeom(point);
        
        // État par défaut : "En attente" (ID 1)
        EtatSignalement etatInitial = etatSignalementRepository.findById(1)
                .orElseThrow(() -> new IllegalStateException("État 'En attente' non trouvé"));
        signalement.setEtatActuel(etatInitial);
        
        // Type de travail optionnel
        if (request.getIdTypeTravail() != null) {
            TypeTravail typeTravail = typeTravailRepository.findById(request.getIdTypeTravail())
                    .orElseThrow(() -> new IllegalArgumentException("Type de travail non trouvé avec l'ID: " + request.getIdTypeTravail()));
            signalement.setTypeTravail(typeTravail);
        }
        
        return signalementRepository.save(signalement);
    }

    @Transactional(readOnly = true)
    public List<Signalement> getSignalementsByEtat(Integer etatId) {
        return signalementRepository.findByEtatActuel(etatId);
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
                    existing.setEtatActuel(signalement.getEtatActuel());
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
        signalement.setSynced(false); // Marquer comme non synchronisé
        
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
        
        signalement.setEtatActuel(etat);
        signalement.setSynced(false); // Marquer comme non synchronisé
        
        return signalementRepository.save(signalement);
    }
}
