package com.signalement.service;

import com.google.cloud.firestore.DocumentSnapshot;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service utilitaire pour convertir les valeurs Firebase vers les types Java
 * Gère les cas où Firebase stocke les nombres sous différents formats (Long, Integer, Double, String)
 */
@Service
@Slf4j
public class FirebaseConversionService {

    /**
     * Convertit une valeur depuis Firebase en Long, gérant les cas String et Number
     */
    public Long getLongValue(DocumentSnapshot doc, String fieldName) {
        try {
            Object value = doc.get(fieldName);
            if (value == null) {
                log.debug("Le champ {} est null", fieldName);
                return null;
            }
            
            log.debug("Champ {}: type={}, valeur={}", fieldName, value.getClass().getSimpleName(), value);
            
            if (value instanceof Long) {
                return (Long) value;
            }
            if (value instanceof Integer) {
                return ((Integer) value).longValue();
            }
            if (value instanceof Double) {
                return ((Double) value).longValue();
            }
            if (value instanceof Number) {
                return ((Number) value).longValue();
            }
            if (value instanceof String) {
                return Long.parseLong((String) value);
            }
            
            log.warn("Type non reconnu pour {} : {}", fieldName, value.getClass().getSimpleName());
            return null;
        } catch (Exception e) {
            log.warn("Erreur lors de la conversion de {} en Long: {}", fieldName, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Convertit une valeur depuis Firebase en Integer, gérant les cas String et Number
     */
    public Integer getLongAsInteger(DocumentSnapshot doc, String fieldName) {
        try {
            Long value = getLongValue(doc, fieldName);
            return value != null ? value.intValue() : null;
        } catch (Exception e) {
            log.warn("Erreur lors de la conversion de {} en Integer: {}", fieldName, e.getMessage());
            return null;
        }
    }

    /**
     * Convertit une valeur depuis Firebase en Double, gérant les cas String et Number
     */
    public Double getDoubleValue(DocumentSnapshot doc, String fieldName) {
        try {
            Object value = doc.get(fieldName);
            if (value == null) {
                log.debug("Le champ {} est null", fieldName);
                return null;
            }
            
            if (value instanceof Double) {
                return (Double) value;
            }
            if (value instanceof Integer) {
                return ((Integer) value).doubleValue();
            }
            if (value instanceof Long) {
                return ((Long) value).doubleValue();
            }
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
            if (value instanceof String) {
                return Double.parseDouble((String) value);
            }
            
            log.warn("Type non reconnu pour {} : {}", fieldName, value.getClass().getSimpleName());
            return null;
        } catch (Exception e) {
            log.warn("Erreur lors de la conversion de {} en Double: {}", fieldName, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Récupère un booléen depuis Firebase
     */
    public Boolean getBooleanValue(DocumentSnapshot doc, String fieldName) {
        try {
            Object value = doc.get(fieldName);
            if (value == null) {
                log.debug("Le champ {} est null", fieldName);
                return null;
            }

            if (value instanceof Boolean) {
                return (Boolean) value;
            }
            if (value instanceof String) {
                return Boolean.parseBoolean((String) value);
            }

            log.warn("Type non reconnu pour {} : {}", fieldName, value.getClass().getSimpleName());
            return null;
        } catch (Exception e) {
            log.warn("Erreur lors de la conversion de {} en Boolean: {}", fieldName, e.getMessage());
            return null;
        }
    }
}
