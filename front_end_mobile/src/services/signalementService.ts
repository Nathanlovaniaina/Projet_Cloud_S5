import { db } from '@/firebase';
import { collection, setDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';

export interface TypeTravail {
  id: string;
  libelle: string;
}

export interface NewSignalement {
  latitude: number;
  longitude: number;
  description: string;
  // Accept string or number from UI, but we'll store as number in Firestore
  id_type_travail: number | string;
  titre?: string;
  surface_metre_carree: number;
  url_photo?: string;
  id_utilisateur?: string;
  date_creation?: number;
}

export interface NewPhotoSignalement {
  id_signalement: number;
  url_photo: string;
}

// Récupérer tous les types de travail depuis Firestore
export async function getTypesTravail(): Promise<TypeTravail[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'type_travail')));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      libelle: doc.data().libelle
    }));
  } catch (error) {
    console.error('Erreur récupération types travail:', error);
    return [];
  }
}

// Obtenir le prochain ID pour un signalement
async function getNextId(): Promise<number> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'signalements'), orderBy('id', 'desc'), limit(1)));
    if (querySnapshot.docs.length === 0) {
      return 1;
    }
    const lastDoc = querySnapshot.docs[0];
    return (lastDoc.data().id || 0) + 1;
  } catch (error) {
    console.error('Erreur récupération ID:', error);
    return 1;
  }
}

// Obtenir le prochain ID pour historique_etat_signalement
async function getNextHistoriqueId(): Promise<number> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'historique_etat_signalement'), orderBy('id', 'desc'), limit(1)));
    if (querySnapshot.docs.length === 0) {
      return 1;
    }
    const lastDoc = querySnapshot.docs[0];
    return (lastDoc.data().id || 0) + 1;
  } catch (error) {
    console.error('Erreur récupération ID historique:', error);
    return 1;
  }
}

// Obtenir le prochain ID pour photo_signalement
async function getNextPhotoSignalementId(): Promise<number> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'photo_signalement'), orderBy('id', 'desc'), limit(1)));
    if (querySnapshot.docs.length === 0) {
      return 1;
    }
    const lastDoc = querySnapshot.docs[0];
    return (lastDoc.data().id || 0) + 1;
  } catch (error) {
    console.error('Erreur récupération ID photo_signalement:', error);
    return 1;
  }
}

// Créer un signalement dans Firestore avec historique
export async function createSignalement(data: NewSignalement) {
  try {
    const now = Date.now();
    const nextId = await getNextId();
    const nextHistoriqueId = await getNextHistoriqueId();
    const signalementId = nextId.toString();
    const historiqueId = nextHistoriqueId.toString();
    
    // 1. Créer le signalement avec tous les champs
    await setDoc(doc(db, 'signalements', signalementId), {
      id: nextId,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      id_type_travail: Number(data.id_type_travail),
      titre: data.titre || '',
      surface_metre_carree: data.surface_metre_carree,
      url_photo: data.url_photo || '',
      id_utilisateur: data.id_utilisateur || '',
      date_creation: data.date_creation || now,
      last_update: now
    });
    
    // 2. Créer l'historique d'état avec statut "1" par défaut (En attente)
    await setDoc(doc(db, 'historique_etat_signalement', historiqueId), {
      id: nextHistoriqueId,
      id_signalement: nextId,
      id_etat: 1, // Statut par défaut : "En attente"
      date_changement: now,
      last_update: now
    });
    
    return nextId; // Retourner l'ID numérique
  } catch (error) {
    console.error('Erreur création signalement:', error);
    throw new Error('Erreur création signalement');
  }
}

// Créer un document photo_signalement
export async function createPhotoSignalement(data: NewPhotoSignalement) {
  try {
    const now = Date.now();
    const nextId = await getNextPhotoSignalementId();
    const photoId = nextId.toString();
    
    await setDoc(doc(db, 'photo_signalement', photoId), {
      id: nextId,
      id_signalement: data.id_signalement,
      url_photo: data.url_photo,
      date_ajout: now,
      last_update: now
    });
    
    return photoId;
  } catch (error) {
    console.error('Erreur création photo_signalement:', error);
    throw new Error('Erreur création photo_signalement');
  }
}
