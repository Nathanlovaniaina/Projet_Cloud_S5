package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "etat_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtatSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_etat_signalement")
    private Integer idEtatSignalement;

    @Column(name = "libelle", nullable = false, unique = true, length = 50)
    private String libelle;
}
