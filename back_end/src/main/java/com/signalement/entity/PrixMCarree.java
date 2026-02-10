package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "prix_m_carree")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrixMCarree {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_prix_m_carree")
    private Integer idPrixMCarree;

    @Column(name = "valeur", nullable = false, precision = 20, scale = 2)
    private BigDecimal valeur;

    @Column(name = "date_changement", nullable = false)
    private LocalDate dateChangement;

    @Column(name = "last_update", nullable = false)
    private LocalDate lastUpdate;

    @PrePersist
    protected void onCreate() {
        LocalDate now = LocalDate.now();
        if (dateChangement == null) {
            dateChangement = now;
        }
        lastUpdate = now;
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDate.now();
    }
}
