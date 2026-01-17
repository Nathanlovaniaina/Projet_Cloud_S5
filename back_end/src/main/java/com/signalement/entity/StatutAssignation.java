package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "statut_assignation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatutAssignation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_statut_assignation")
    private Integer idStatutAssignation;

    @Column(name = "libelle", nullable = false, unique = true, length = 20)
    private String libelle;
}
