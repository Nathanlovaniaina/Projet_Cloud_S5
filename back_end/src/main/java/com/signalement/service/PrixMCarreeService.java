package com.signalement.service;

import com.signalement.entity.PrixMCarree;
import com.signalement.repository.PrixMCarreeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrixMCarreeService {

    private final PrixMCarreeRepository prixMCarreeRepository;

    /**
     * Récupère le prix m² valide à une date donnée
     * Si aucune date n'est fournie, retourne le prix le plus récent
     */
    @Transactional(readOnly = true)
    public Optional<PrixMCarree> getPrixAtDate(LocalDate date) {
        if (date == null) {
            return prixMCarreeRepository.findTopByOrderByDateChangementDesc();
        }
        return prixMCarreeRepository.findPrixAtDate(date);
    }

    /**
     * Ajoute un nouveau prix m²
     */
    @Transactional
    public PrixMCarree ajouterPrix(PrixMCarree prixMCarree) {
        return prixMCarreeRepository.save(prixMCarree);
    }
}
