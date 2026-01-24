package com.signalement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "synchronisation_firebase")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SynchronisationFirebase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_synchronisation_firebase")
    private Integer idSynchronisationFirebase;

    @Column(name = "remarque", columnDefinition = "TEXT")
    private String remarque;

    @Column(name = "date_synchronisation", nullable = false)
    private LocalDateTime dateSynchronisation;

    @Column(name = "success", nullable = false)
    private Boolean success;
}
