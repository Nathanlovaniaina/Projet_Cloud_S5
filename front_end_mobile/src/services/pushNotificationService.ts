import { PushNotifications } from '@capacitor/push-notifications';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, limit, where, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { currentUser } from '@/composables/useAuth';

/**
 * Service pour gérer les Push Notifications avec Firebase Cloud Messaging
 * - Initialise Capacitor Push Notifications
 * - Récupère le FCM token
 * - Envoie le token à Firestore
 * - Gère les événements de notification
 */

interface FcmTokenData {
  fcmToken: string;
  deviceName: string;
  dateCreation: Date;
  lastUpdate: Date;
  idUtilisateur: number | null;
}

export const pushNotificationService = {
  /**
   * Initialiser les Push Notifications et récupérer le token FCM
   */
  async initializePushNotifications(): Promise<string | null> {
    try {
      console.log('🔔 Initialisation des Push Notifications...');

      // Demander la permission d'afficher les notifications
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ Permission de notification refusée');
        return null;
      }

      // Enregistrer les handlers avant de récupérer le token
      await this.setupNotificationHandlers();

      // Récupérer le token FCM
      const token = await this.getAndStoreFcmToken();

      if (token) {
        console.log('✅ FCM Token récupéré et envoyé à Firestore:', token);
      }

      return token;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des push notifications:', error);
      return null;
    }
  },

  /**
   * Récupérer le token FCM et l'envoyer à Firestore
   */
  async getAndStoreFcmToken(): Promise<string | null> {
    try {
      // Après requestPermissions(), le token est obtenu via l'event 'registration'
      // Ou on peut le récupérer directement après enregistrement
      // Le token est retourné dans un listener 'registration'
      
      return new Promise((resolve) => {
        // Configurer un listener pour récupérer le token
        PushNotifications.addListener('registration', async (token) => {
          const fcmToken = token.value;
          console.log('📱 FCM Token obtenu:', fcmToken);
          
          try {
            // Envoyer à Firestore
            await this.saveFcmTokenToFirestore(fcmToken);

            // Sauvegarder en localStorage aussi
            localStorage.setItem('fcmToken', fcmToken);
            localStorage.setItem('fcmTokenTimestamp', new Date().toISOString());

            resolve(fcmToken);
          } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde du token:', error);
            resolve(fcmToken); // Retourner quand même le token
          }
        });

        // Timeout après 10 secondes
        setTimeout(() => {
          resolve(null);
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du FCM token:', error);
      return null;
    }
  },

  /**
   * Sauvegarder le FCM token dans Firestore
   */
  async saveFcmTokenToFirestore(fcmToken: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn('⚠️ Utilisateur non authentifié. Token sauvegardé en local.');
        sessionStorage.setItem('pendingFcmToken', fcmToken);
        return;
      }

      const firestore = getFirestore();
      const deviceName = this.getDeviceName();
      const now = Date.now(); // Timestamp en millisecondes

      // Récupérer le prochain ID
      const nextId = await this.getNextFcmTokenId();

      // Récupérer l'ID utilisateur PostgreSQL (comme dans AddSignalementPage)
      const idUtilisateur = currentUser.value?.id || null;

      // Document ID = l'ID numérique (1, 2, 3, etc.)
      const tokenDocRef = doc(
        firestore,
        'utilisateur_fcm_tokens',
        nextId.toString()
      );

      await setDoc(tokenDocRef, {
        id: nextId,
        fcm_token: fcmToken,
        device_name: deviceName,
        date_creation: now,
        last_update: now,
        enable: true, // Activé par défaut
        id_utilisateur: idUtilisateur,
      });

      // Sauvegarder le token en localStorage aussi
      localStorage.setItem('fcmToken', fcmToken);
      localStorage.setItem('fcmTokenTimestamp', new Date().toISOString());

      console.log('✅ FCM Token sauvegardé dans Firestore avec ID:', nextId);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du token à Firestore:', error);
      throw error;
    }
  },

  /**
   * Obtenir le prochain ID pour un FCM token
   */
  async getNextFcmTokenId(): Promise<number> {
    try {
      const firestore = getFirestore();
      const querySnapshot = await getDocs(
        query(
          collection(firestore, 'utilisateur_fcm_tokens'),
          orderBy('id', 'desc'),
          limit(1)
        )
      );

      if (querySnapshot.docs.length === 0) {
        return 1;
      }

      const lastDoc = querySnapshot.docs[0];
      return (lastDoc.data().id || 0) + 1;
    } catch (error) {
      console.error('⚠️ Erreur récupération ID FCM token (collection vide?):', error);
      return 1;
    }
  },

  /**
   * Configurer les handlers pour les événements de notification
   */
  async setupNotificationHandlers(): Promise<void> {
    try {
      // Quand une notification est reçue
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('📬 Notification reçue:', notification);
          // Traiter la notification en avant-plan si nécessaire
          this.handleNotificationReceived(notification);
        }
      );

      // Quand l'utilisateur clique sur la notification
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('👆 Notification cliquée:', notification);
          // Naviguer vers la page appropriée
          this.handleNotificationClicked(notification);
        }
      );

      // Quand le token est rafraîchi
      PushNotifications.addListener(
        'registration',
        (token) => {
          console.log('🔄 Token rafraîchi:', token.value);
          // Sauvegarder le nouveau token
          this.saveFcmTokenToFirestore(token.value);
        }
      );

      // En cas d'erreur de registration
      PushNotifications.addListener(
        'registrationError',
        (error: any) => {
          console.error('❌ Erreur de registration:', error);
        }
      );

      console.log('✅ Handlers de notification configurés');
    } catch (error) {
      console.error('❌ Erreur lors de la configuration des handlers:', error);
    }
  },

  /**
   * Traiter une notification reçue en avant-plan
   */
  handleNotificationReceived(notification: any): void {
    const { title, body, data } = notification.notification;
    console.log(`📢 Titre: ${title}, Corps: ${body}`);
    console.log('📦 Données:', data);

    // Vous pouvez afficher un toast ou une alerte ici
    // Par exemple : showToast(body)
  },

  /**
   * Traiter un clic sur la notification
   */
  handleNotificationClicked(notification: any): void {
    const { data } = notification.notification;
    console.log('🎯 Navigation basée sur:', data);

    // Naviguer vers la page appropriée en fonction des données
    if (data?.signalementId) {
      // Naviguer vers les détails du signalement
      window.location.href = `/signalement/${data.signalementId}`;
    }
  },

  /**
   * Obtenir le nom du device
   */
  getDeviceName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Android')) {
      return 'Mobile Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'Mobile iOS';
    } else if (userAgent.includes('Windows')) {
      return 'Web Windows';
    } else if (userAgent.includes('Mac')) {
      return 'Web Mac';
    } else if (userAgent.includes('Linux')) {
      return 'Web Linux';
    }
    
    return 'Mobile';
  },

  /**
   * Récupérer le token FCM sauvegardé localement
   */
  getSavedFcmToken(): string | null {
    return localStorage.getItem('fcmToken');
  },

  /**
   * Vérifier le statut du token FCM (enable ou disable)
   * @returns true si enable, false si disable, null si pas de token trouvé
   */
  async checkFcmTokenStatus(): Promise<boolean | null> {
    try {
      const fcmToken = this.getSavedFcmToken();
      
      if (!fcmToken) {
        console.warn('⚠️ Aucun token FCM sauvegardé localement');
        return null;
      }

      const firestore = getFirestore();

      // Chercher le document par fcm_token
      const querySnapshot = await getDocs(
        query(
          collection(firestore, 'utilisateur_fcm_tokens'),
          where('fcm_token', '==', fcmToken)
        )
      );

      if (querySnapshot.docs.length === 0) {
        console.warn('⚠️ Token FCM non trouvé dans Firestore');
        return null;
      }

      const tokenDoc = querySnapshot.docs[0];
      const enableStatus = tokenDoc.data().enable;
      
      console.log('🔍 Statut du token FCM:', enableStatus ? 'Activé' : 'Désactivé');
      return enableStatus;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut du token:', error);
      return null;
    }
  },

  /**
   * Supprimer le token FCM sauvegardé
   */
  clearSavedFcmToken(): void {
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('fcmTokenTimestamp');
  },

  /**
   * Désactiver le token FCM (enable = false)
   * @param idUtilisateur ID de l'utilisateur (non utilisé, cherche par token)
   */
  async disableFcmToken(idUtilisateur: number): Promise<void> {
    try {
      const fcmToken = this.getSavedFcmToken();
      
      if (!fcmToken) {
        console.warn('⚠️ Aucun token FCM sauvegardé localement');
        return;
      }

      const firestore = getFirestore();

      // Chercher le document par fcm_token (unique)
      const querySnapshot = await getDocs(
        query(
          collection(firestore, 'utilisateur_fcm_tokens'),
          where('fcm_token', '==', fcmToken)
        )
      );

      if (querySnapshot.docs.length === 0) {
        console.warn('⚠️ Token FCM non trouvé dans Firestore');
        return;
      }

      // Mettre à jour le document pour désactiver le token
      const docToUpdate = querySnapshot.docs[0];
      await updateDoc(docToUpdate.ref, {
        enable: false,
        last_update: Date.now()
      });

      console.log('✅ Token FCM désactivé');
    } catch (error) {
      console.error('❌ Erreur lors de la désactivation du token FCM:', error);
      throw error;
    }
  },

  /**
   * Activer le token FCM (enable = true)
   * @param idUtilisateur ID de l'utilisateur (non utilisé, cherche par token)
   */
  async enableFcmToken(idUtilisateur: number): Promise<void> {
    try {
      const fcmToken = this.getSavedFcmToken();
      
      if (!fcmToken) {
        console.warn('⚠️ Aucun token FCM sauvegardé localement');
        return;
      }

      const firestore = getFirestore();

      // Chercher le document par fcm_token (unique)
      const querySnapshot = await getDocs(
        query(
          collection(firestore, 'utilisateur_fcm_tokens'),
          where('fcm_token', '==', fcmToken)
        )
      );

      if (querySnapshot.docs.length === 0) {
        console.warn('⚠️ Token FCM non trouvé dans Firestore');
        return;
      }

      // Mettre à jour le document pour activer le token
      const docToUpdate = querySnapshot.docs[0];
      await updateDoc(docToUpdate.ref, {
        enable: true,
        last_update: Date.now()
      });

      console.log('✅ Token FCM activé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'activation du token FCM:', error);
      throw error;
    }
  },
};

export default pushNotificationService;
