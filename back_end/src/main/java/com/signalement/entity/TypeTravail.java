package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "type_travail")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypeTravail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_type_travail")
    private Integer idTypeTravail;

    @Column(name = "libelle", nullable = false, unique = true, length = 50)
    private String libelle;

    @Column(name = "last_update", nullable = false)
    private LocalDateTime lastUpdate = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
}
