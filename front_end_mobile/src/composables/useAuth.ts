import { ref } from 'vue';
import { getAuth, signInWithEmailAndPassword, signOut, onIdTokenChanged, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import '../firebase'; // assure que firebase est initialisé

interface FirestoreUser {
  id: string;
  [key: string]: any;
}

const auth = getAuth();
const db = getFirestore();
export const currentUser = ref<FirestoreUser | null>(null);
let expiryTimer: number | null = null;

// Gestion de l'expiration du token
function clearExpiryTimer() {
  if (expiryTimer) {
    window.clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}

function scheduleExpiryLogout(expirationTimeIso?: string) {
  clearExpiryTimer();
  if (!expirationTimeIso) return;
  
  const expiresAt = new Date(expirationTimeIso).getTime();
  const ms = expiresAt - Date.now();
  
  if (ms <= 0) {
    // Token déjà expiré
    auth.currentUser?.getIdToken(true).catch(() => signOut(auth));
    return;
  }
  
  expiryTimer = window.setTimeout(async () => {
    try {
      // Essayer de forcer un refresh du token
      await auth.currentUser?.getIdToken(true);
      // Si réussi, onIdTokenChanged sera appelé et reprogrammera un timer
    } catch (e) {
      // Échec du refresh => déconnecter proprement
      await signOut(auth);
      currentUser.value = null;
      localStorage.removeItem('app_user');
      console.warn('Session expirée : token non rafraîchi.');
    }
  }, ms + 1000); // marge de 1s
}

// Écoute les changements du token (rafraîchi automatiquement)
onIdTokenChanged(auth, async (user) => {
  if (!user) {
    clearExpiryTimer();
    currentUser.value = null;
    localStorage.removeItem('app_user');
    return;
  }
  
  // Obtenir l'expiration du token courant
  const tokenResult = await user.getIdTokenResult();
  scheduleExpiryLogout(tokenResult.expirationTime);
});

// Écoute les changements d'état d'authentification
onAuthStateChanged(auth, (user) => {
  if (!user) {
    clearExpiryTimer();
    currentUser.value = null;
    localStorage.removeItem('app_user');
  }
});

export async function login(email: string, password: string) {
  // Vider le localStorage d'abord pour éviter les conflits
  localStorage.removeItem('app_user');
  currentUser.value = null;

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  // récupérer le document Firestore lié
  const userDoc = await getFirestoreUserByUid(uid);
  if (userDoc) {
    // stocker en localStorage le nouveau profil
    localStorage.setItem('app_user', JSON.stringify(userDoc));
    currentUser.value = userDoc;
  }
  return userDoc;
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem('app_user');
  currentUser.value = null;
}

export async function getFirestoreUserByUid(firebaseUid: string) {
  const col = collection(db, 'utilisateurs');
  const q = query(col, where('firebase_uid', '==', firebaseUid));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  return null;
}

export function loadUserFromStorage() {
  const s = localStorage.getItem('app_user');
  if (s) {
    try {
      currentUser.value = JSON.parse(s);
    } catch (e) {
      localStorage.removeItem('app_user');
    }
  }
}
