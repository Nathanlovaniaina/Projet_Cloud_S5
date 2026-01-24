package com.signalement.service;

import com.signalement.dto.StatisticsDTO;
import com.signalement.entity.*;
import com.signalement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private final SignalementRepository signalementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final EntrepriseConcernerRepository entrepriseConcernerRepository;
    private final EtatSignalementRepository etatSignalementRepository;
    private final TypeTravailRepository typeTravailRepository;
    private final HistoriqueEtatSignalementRepository historiqueEtatSignalementRepository;
    private final TypeUtilisateurRepository typeUtilisateurRepository;

    /**
     * Récupère les statistiques globales du système
     */
    public StatisticsDTO getSummaryStatistics() {
        // Récupérer tous les signalements
        List<Signalement> allSignalements = signalementRepository.findAll();

        // Compter les signalements par état actuel
        Map<String, Integer> countByEtat = countByEtat(allSignalements);

        // Récupérer tous les utilisateurs
        List<Utilisateur> allUtilisateurs = utilisateurRepository.findAll();

        // Compter les utilisateurs par type
        TypeUtilisateur citoyenType = typeUtilisateurRepository.findById(1)
                .orElse(null);
        TypeUtilisateur managerType = typeUtilisateurRepository.findById(2)
                .orElse(null);

        int citoyens = (int) allUtilisateurs.stream()
                .filter(u -> u.getTypeUtilisateur() != null && u.getTypeUtilisateur().equals(citoyenType))
                .count();
        int managers = (int) allUtilisateurs.stream()
                .filter(u -> u.getTypeUtilisateur() != null && u.getTypeUtilisateur().equals(managerType))
                .count();
        int comptesBloques = (int) allUtilisateurs.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsBlocked()))
                .count();

        // Récupérer toutes les entreprises
        List<Entreprise> allEntreprises = entrepriseRepository.findAll();
        int entreprisesActives = allEntreprises.size(); // Toutes les entreprises en base sont considérées actives

        // Récupérer toutes les assignations (EntrepriseConcerner)
        List<EntrepriseConcerner> allAssignations = entrepriseConcernerRepository.findAll();
        int assignationsEnCours = (int) allAssignations.stream()
                .filter(ec -> {
                    // Vérifier si le signalement associé est "en cours"
                    Signalement sig = ec.getSignalement();
                    if (sig == null) return false;
                    
                    Optional<HistoriqueEtatSignalement> latestHistorique = 
                            historiqueEtatSignalementRepository.findLatestBySignalement(sig);
                    
                    if (latestHistorique.isEmpty()) return false;
                    
                    EtatSignalement etat = latestHistorique.get().getEtatSignalement();
                    return etat != null && "en cours".equalsIgnoreCase(etat.getLibelle());
                })
                .count();

        int assignationsTerminees = (int) allAssignations.stream()
                .filter(ec -> {
                    Signalement sig = ec.getSignalement();
                    if (sig == null) return false;
                    
                    Optional<HistoriqueEtatSignalement> latestHistorique = 
                            historiqueEtatSignalementRepository.findLatestBySignalement(sig);
                    
                    if (latestHistorique.isEmpty()) return false;
                    
                    EtatSignalement etat = latestHistorique.get().getEtatSignalement();
                    return etat != null && "terminé".equalsIgnoreCase(etat.getLibelle());
                })
                .count();

        // Calculer les taux moyens
        List<StatisticsDTO.EntreprisePerformanceDTO> performances = getEnterpriseStatistics();
        double tauxCompletionMoyen = performances.isEmpty() ? 0.0 :
                performances.stream()
                        .mapToDouble(StatisticsDTO.EntreprisePerformanceDTO::getTauxCompletion)
                        .average()
                        .orElse(0.0);
        
        double tauxPonctualiteMoyen = performances.isEmpty() ? 0.0 :
                performances.stream()
                        .mapToDouble(StatisticsDTO.EntreprisePerformanceDTO::getTauxPonctualite)
                        .average()
                        .orElse(0.0);

        // Top 5 entreprises
        List<StatisticsDTO.EntreprisePerformanceDTO> top5 = performances.stream()
                .sorted(Comparator.comparing(StatisticsDTO.EntreprisePerformanceDTO::getTauxCompletion).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return StatisticsDTO.builder()
                .totalSignalements(allSignalements.size())
                .signalementsEnAttente(countByEtat.getOrDefault("en attente", 0))
                .signalementsEnCours(countByEtat.getOrDefault("en cours", 0))
                .signalementsTermines(countByEtat.getOrDefault("terminé", 0))
                .totalUtilisateurs(allUtilisateurs.size())
                .citoyens(citoyens)
                .managers(managers)
                .comptesBloques(comptesBloques)
                .totalEntreprises(allEntreprises.size())
                .entreprisesActives(entreprisesActives)
                .entreprisesInactives(allEntreprises.size() - entreprisesActives)
                .totalAssignations(allAssignations.size())
                .assignationsEnCours(assignationsEnCours)
                .assignationsTerminees(assignationsTerminees)
                .tauxCompletionMoyen(tauxCompletionMoyen)
                .tauxPonctualiteMoyen(tauxPonctualiteMoyen)
                .top5Entreprises(top5)
                .dateCalcul(LocalDateTime.now())
                .build();
    }

    /**
     * Compte les signalements par état actuel
     */
    private Map<String, Integer> countByEtat(List<Signalement> signalements) {
        Map<String, Integer> result = new HashMap<>();

        for (Signalement sig : signalements) {
            Optional<HistoriqueEtatSignalement> latestHistorique = 
                    historiqueEtatSignalementRepository.findLatestBySignalement(sig);

            if (latestHistorique.isPresent()) {
                EtatSignalement etat = latestHistorique.get().getEtatSignalement();
                if (etat != null && etat.getLibelle() != null) {
                    String etatLabel = etat.getLibelle().toLowerCase();
                    result.put(etatLabel, result.getOrDefault(etatLabel, 0) + 1);
                }
            }
        }

        return result;
    }

    /**
     * Récupère les signalements groupés par type de travail
     */
    private Map<TypeTravail, List<Signalement>> getSignalementsByType() {
        List<Signalement> allSignalements = signalementRepository.findAll();
        return allSignalements.stream()
                .filter(s -> s.getTypeTravail() != null)
                .collect(Collectors.groupingBy(Signalement::getTypeTravail));
    }

    /**
     * Récupère les signalements groupés par état actuel
     */
    private Map<String, List<Signalement>> getSignalementsByState() {
        List<Signalement> allSignalements = signalementRepository.findAll();
        Map<String, List<Signalement>> result = new HashMap<>();

        for (Signalement sig : allSignalements) {
            Optional<HistoriqueEtatSignalement> latestHistorique = 
                    historiqueEtatSignalementRepository.findLatestBySignalement(sig);

            if (latestHistorique.isPresent()) {
                EtatSignalement etat = latestHistorique.get().getEtatSignalement();
                if (etat != null && etat.getLibelle() != null) {
                    String etatLabel = etat.getLibelle().toLowerCase();
                    result.computeIfAbsent(etatLabel, k -> new ArrayList<>()).add(sig);
                }
            }
        }

        return result;
    }

    /**
     * Récupère les statistiques par type de travail
     */
    public List<StatisticsDTO.TypeTravailStatDTO> getStatisticsByWorkType() {
        Map<TypeTravail, List<Signalement>> byType = getSignalementsByType();
        int totalSignalements = signalementRepository.findAll().size();

        return byType.entrySet().stream()
                .map(entry -> {
                    TypeTravail type = entry.getKey();
                    List<Signalement> signalements = entry.getValue();

                    Map<String, Integer> countByEtat = countByEtat(signalements);

                    double pourcentage = totalSignalements > 0 ?
                            (signalements.size() * 100.0 / totalSignalements) : 0.0;

                    return StatisticsDTO.TypeTravailStatDTO.builder()
                            .idTypeTravail(type.getIdTypeTravail())
                            .nomType(type.getLibelle())
                            .total(signalements.size())
                            .enAttente(countByEtat.getOrDefault("en attente", 0))
                            .enCours(countByEtat.getOrDefault("en cours", 0))
                            .termine(countByEtat.getOrDefault("terminé", 0))
                            .pourcentage(Math.round(pourcentage * 100.0) / 100.0)
                            .build();
                })
                .sorted(Comparator.comparing(StatisticsDTO.TypeTravailStatDTO::getTotal).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Récupère les statistiques par état
     */
    public List<StatisticsDTO.EtatStatDTO> getStatisticsByState() {
        Map<String, List<Signalement>> byState = getSignalementsByState();
        int totalSignalements = signalementRepository.findAll().size();

        // Récupérer tous les états possibles
        List<EtatSignalement> allEtats = etatSignalementRepository.findAll();

        return allEtats.stream()
                .map(etat -> {
                    String etatLabel = etat.getLibelle().toLowerCase();
                    List<Signalement> signalements = byState.getOrDefault(etatLabel, new ArrayList<>());
                    int count = signalements.size();
                    double pourcentage = totalSignalements > 0 ?
                            (count * 100.0 / totalSignalements) : 0.0;

                    return StatisticsDTO.EtatStatDTO.builder()
                            .idEtat(etat.getIdEtatSignalement())
                            .etat(etat.getLibelle())
                            .count(count)
                            .pourcentage(Math.round(pourcentage * 100.0) / 100.0)
                            .build();
                })
                .sorted(Comparator.comparing(StatisticsDTO.EtatStatDTO::getCount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Récupère les statistiques par entreprise
     */
    public List<StatisticsDTO.EntreprisePerformanceDTO> getEnterpriseStatistics() {
        List<Entreprise> allEntreprises = entrepriseRepository.findAll();

        return allEntreprises.stream()
                .map(entreprise -> {
                    // Récupérer toutes les assignations de cette entreprise
                    List<EntrepriseConcerner> assignations = entrepriseConcernerRepository.findAll().stream()
                            .filter(ec -> ec.getEntreprise() != null && 
                                    ec.getEntreprise().getIdEntreprise().equals(entreprise.getIdEntreprise()))
                            .collect(Collectors.toList());

                    int tachesAssignees = assignations.size();

                    // Compter les tâches terminées
                    int tachesTerminees = (int) assignations.stream()
                            .filter(ec -> {
                                Signalement sig = ec.getSignalement();
                                if (sig == null) return false;

                                Optional<HistoriqueEtatSignalement> latestHistorique = 
                                        historiqueEtatSignalementRepository.findLatestBySignalement(sig);

                                if (latestHistorique.isEmpty()) return false;

                                EtatSignalement etat = latestHistorique.get().getEtatSignalement();
                                return etat != null && "terminé".equalsIgnoreCase(etat.getLibelle());
                            })
                            .count();

                    // Calculer le taux de complétion
                    double tauxCompletion = tachesAssignees > 0 ?
                            (tachesTerminees * 100.0 / tachesAssignees) : 0.0;

                    // Calculer le taux de ponctualité (simplifié: 95% si tauxCompletion > 80%, sinon proportionnel)
                    double tauxPonctualite = tauxCompletion > 80 ? 95.0 : tauxCompletion * 0.9;

                    return StatisticsDTO.EntreprisePerformanceDTO.builder()
                            .idEntreprise(entreprise.getIdEntreprise())
                            .nomEntreprise(entreprise.getNomDuCompagnie())
                            .tachesAssignees(tachesAssignees)
                            .tachesTerminees(tachesTerminees)
                            .tauxCompletion(Math.round(tauxCompletion * 100.0) / 100.0)
                            .tauxPonctualite(Math.round(tauxPonctualite * 100.0) / 100.0)
                            .build();
                })
                .filter(perf -> perf.getTachesAssignees() > 0) // Ne garder que les entreprises avec des tâches
                .sorted(Comparator.comparing(StatisticsDTO.EntreprisePerformanceDTO::getTauxCompletion).reversed())
                .collect(Collectors.toList());
    }
}
