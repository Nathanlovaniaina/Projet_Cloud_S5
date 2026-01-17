package com.signalement.service;

import com.signalement.entity.EtatSignalement;
import com.signalement.repository.EtatSignalementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EtatSignalementService {

    private final EtatSignalementRepository etatSignalementRepository;

    @Transactional(readOnly = true)
    public List<EtatSignalement> getAllEtats() {
        return etatSignalementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<EtatSignalement> getEtatById(Integer id) {
        return etatSignalementRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<EtatSignalement> getEtatByLibelle(String libelle) {
        return etatSignalementRepository.findByLibelle(libelle);
    }
}
