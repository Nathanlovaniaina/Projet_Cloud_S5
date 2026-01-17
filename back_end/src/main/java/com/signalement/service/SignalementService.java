package com.signalement.service;

import com.signalement.entity.Signalement;
import com.signalement.entity.Utilisateur;
import com.signalement.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository signalementRepository;

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
}
