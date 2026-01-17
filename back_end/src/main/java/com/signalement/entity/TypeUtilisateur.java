package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "type_utilisateur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypeUtilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_type_utilisateur")
    private Integer idTypeUtilisateur;

    @Column(name = "libelle", nullable = false, unique = true, length = 50)
    private String libelle;
}
