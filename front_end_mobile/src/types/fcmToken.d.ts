/**
 * Définitions de types pour les FCM Tokens
 */

export interface FcmTokenData {
  fcmToken: string;
  deviceName: string;
  dateCreation: Date;
  lastUpdate: Date;
  idUtilisateur: number | null;
}

export interface FcmTokenResponse {
  fcmToken: string;
  deviceName: string;
  timestamp: string;
}

export interface PushNotificationPayload {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

export interface NotificationAction {
  actionId: string;
  notification: PushNotificationPayload;
}
