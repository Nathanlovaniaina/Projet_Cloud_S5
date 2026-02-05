import { ref } from 'vue';
import pushNotificationService from '../services/pushNotificationService';

/**
 * Composable Vue pour gérer les Push Notifications
 * Wrapper autour du pushNotificationService
 */

const fcmToken = ref<string | null>(null);
const isInitialized = ref(false);
const initError = ref<string | null>(null);

export const usePushNotifications = () => {
  /**
   * Initialiser les push notifications
   */
  const initializePushNotifications = async (): Promise<void> => {
    try {
      initError.value = null;
      console.log('🚀 Initialisation des notifications push...');

      const token = await pushNotificationService.initializePushNotifications();
      
      if (token) {
        fcmToken.value = token;
        isInitialized.value = true;
        console.log('✅ Push notifications initialisées avec succès');
      } else {
        console.warn('⚠️ Token FCM non récupéré');
        isInitialized.value = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      initError.value = errorMessage;
      console.error('❌ Erreur lors de l\'initialisation:', errorMessage);
      isInitialized.value = false;
    }
  };

  /**
   * Récupérer le token FCM sauvegardé
   */
  const getFcmToken = (): string | null => {
    if (!fcmToken.value) {
      fcmToken.value = pushNotificationService.getSavedFcmToken();
    }
    return fcmToken.value;
  };

  /**
   * Vérifier si les notifications sont initialisées
   */
  const isNotificationsAvailable = (): boolean => {
    return isInitialized.value;
  };

  /**
   * Supprimer le token sauvegardé (logout)
   */
  const clearNotificationToken = (): void => {
    pushNotificationService.clearSavedFcmToken();
    fcmToken.value = null;
    isInitialized.value = false;
    console.log('🗑️ Token de notification supprimé');
  };

  /**
   * Obtenir le statut actuel
   */
  const getStatus = () => {
    return {
      isInitialized: isInitialized.value,
      hasToken: !!fcmToken.value,
      token: fcmToken.value,
      error: initError.value,
    };
  };

  return {
    fcmToken,
    isInitialized,
    initError,
    initializePushNotifications,
    getFcmToken,
    isNotificationsAvailable,
    clearNotificationToken,
    getStatus,
  };
};

export default usePushNotifications;
