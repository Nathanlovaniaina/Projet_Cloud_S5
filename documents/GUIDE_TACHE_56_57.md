# Guide d'Exécution - Tâches 56 et 57
## Setup Frontend Mobile - Ionic + Vue.js + Firebase

---

## 📋 Résumé des Tâches

| Tâche | Catégorie | Module | Objectif | Estimation |
|-------|-----------|--------|----------|-----------|
| **56** | Frontend Mobile | Setup | Initialisation du projet Ionic avec Vue.js | 60 min |
| **57** | Frontend Mobile | Setup | Configuration de Firebase SDK pour mobile | 90 min |

**Durée totale estimée** : 150 minutes (2h30)  
**Assigné à** : ETU003358

---

## 🎯 Objectifs Finaux

À la fin de ces deux tâches, vous aurez:
- ✅ Un projet Ionic initié avec Vue.js fonctionnel
- ✅ Firebase SDK configuré et intégré au projet mobile
- ✅ Structure de base prête pour les développements ultérieurs (auth, géolocalisation, etc.)

---

## 📝 Prérequis

Avant de commencer, vérifiez que vous avez installé:

- **Node.js** (v16 ou supérieur) - [Télécharger](https://nodejs.org/)
- **npm** (v7 ou supérieur) - Installé avec Node.js
- **Ionic CLI** - À installer si nécessaire
- **Git** - Pour versionner le code
- **Compte Firebase** avec un projet créé

### Installation de l'Ionic CLI

```bash
npm install -g @ionic/cli
```

Vérifiez l'installation:
```bash
ionic --version
```

---

## 🚀 Tâche 56 : Initialisation du Projet Ionic avec Vue.js

### Étape 1 : Créer un nouveau projet Ionic avec Vue.js

Naviguez dans le répertoire du projet:

```bash
cd "c:\Users\Mamisoa\Documents\Project cloud s5\Projet_Cloud_S5"
```

Créez le projet Ionic:

```bash
ionic start front_end_mobile blank --type=vue
```

**Explication** :
- `ionic start` : Crée un nouveau projet Ionic
- `front_end_mobile` : Nom du répertoire du projet
- `blank` : Template de démarrage (page vide, plutôt que tabs ou sidemenu)
- `--type=vue` : Utilise Vue.js comme framework

### Étape 2 : Accéder au répertoire du projet

```bash
cd front_end_mobile
```

### Étape 3 : Vérifier la structure du projet

Une fois créé, votre arborescence devrait ressembler à ceci:

```
front_end_mobile/
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── views/
│   │   └── HomePage.vue
│   ├── router/
│   │   └── index.ts
│   ├── theme/
│   │   └── variables.css
│   └── ...
├── public/
├── package.json
├── ionic.config.json
├── tsconfig.json
├── vite.config.ts
└── ...
```

### Étape 4 : Installer les dépendances

```bash
npm install
```

### Étape 5 : Tester le serveur de développement

```bash
ionic serve
```

Une fenêtre de navigateur s'ouvrira à `http://localhost:8100`. Vous devriez voir la page d'accueil.

**Vérifications** :
- ✅ Pas d'erreurs dans la console
- ✅ L'application Ionic s'affiche correctement
- ✅ Vous pouvez naviguer sans problèmes

### Étape 6 : Configuration du Vite (si nécessaire)

Vérifiez le fichier `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { IonicVueConfig } from '@ionic/vue'

export default defineConfig({
  plugins: [
    vue(IonicVueConfig())
  ]
})
```

### ✅ Tâche 56 Complétée

À ce stade, vous avez:
- ✅ Un projet Ionic initialisé avec Vue.js
- ✅ Un serveur de développement fonctionnel
- ✅ Une structure de projet prête pour les développements

---

## 🔥 Tâche 57 : Configuration de Firebase SDK pour Mobile

### Étape 1 : Créer/Récupérer votre Projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Connectez-vous avec votre compte Google
3. Créez un nouveau projet ou utilisez un existant
4. Activez les services suivants:
   - **Authentication** (pour la connexion)
   - **Realtime Database** (pour la synchronisation)
   - **Cloud Storage** (pour les images/fichiers)

### Étape 2 : Récupérer les Credentials Firebase

1. Dans la Firebase Console, allez à **Paramètres du projet** (gear icon)
2. Allez à l'onglet **Applications**
3. Créez une nouvelle application **Web**:
   - Nommez-la "Signalement Mobile"
   - Cochez "Aussi configurer Firebase Hosting"

4. **Copiez les credentials Firebase**:

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
}
```

### Étape 3 : Installer Firebase SDK

Installez les packages nécessaires:

```bash
npm install firebase
```

### Étape 4 : Créer le Fichier de Configuration Firebase

Créez un fichier `src/firebase/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Configuration Firebase - À remplacer avec vos credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser les services Firebase
export const auth = getAuth(app)
export const database = getDatabase(app)
export const storage = getStorage(app)

export default app
```

### Étape 5 : Créer un Composable pour Firebase (Réutilisabilité)

Créez un fichier `src/composables/useFirebase.ts`:

```typescript
import { ref } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth'
import { auth } from '@/firebase/firebase'

export function useFirebase() {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Initialiser le listener d'authentification
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })

  // Connexion
  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return userCredential.user
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Inscription
  const register = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return userCredential.user
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Déconnexion
  const logout = async () => {
    loading.value = true
    error.value = null
    try {
      await signOut(auth)
      user.value = null
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout
  }
}
```

### Étape 6 : Importer Firebase dans App.vue

Modifiez `src/App.vue` pour initialiser Firebase:

```vue
<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { onMounted } from 'vue'
import app from '@/firebase/firebase'

onMounted(() => {
  console.log('Firebase initialized:', app)
})
</script>

<style scoped>
</style>
```

### Étape 7 : Tester la Configuration Firebase

Modifiez `src/views/HomePage.vue` pour tester Firebase:

```vue
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Test Firebase</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Test Firebase</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <h2>Firebase Initialization Test</h2>

        <div v-if="user">
          <p><strong>Utilisateur connecté:</strong> {{ user.email }}</p>
          <ion-button @click="handleLogout" color="danger">
            Déconnexion
          </ion-button>
        </div>

        <div v-else>
          <p>Aucun utilisateur connecté</p>
          <ion-button @click="handleTestLogin" color="primary">
            Test Login
          </ion-button>
        </div>

        <div v-if="error" class="error-message">
          <p><strong>Erreur:</strong> {{ error }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue'
import { useFirebase } from '@/composables/useFirebase'

const { user, error, login, logout } = useFirebase()

const handleTestLogin = async () => {
  try {
    // Utilisez des credentials de test
    await login('test@example.com', 'password123')
    console.log('Login réussi')
  } catch (err) {
    console.error('Login échoué:', err)
  }
}

const handleLogout = async () => {
  try {
    await logout()
    console.log('Logout réussi')
  } catch (err) {
    console.error('Logout échoué:', err)
  }
}
</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}

.error-message {
  color: red;
  margin-top: 20px;
}
</style>
```

### Étape 8 : Vérifier la Configuration

Relancez le serveur de développement:

```bash
ionic serve
```

**Vérifications** :
- ✅ L'application s'ouvre sans erreurs
- ✅ Les logs Firebase s'affichent dans la console
- ✅ Pas d'erreurs de configuration

### Étape 9 : Ajouter un Fichier .env (Important!)

Créez un fichier `.env` à la racine du projet pour sécuriser vos credentials:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

Mettez à jour `src/firebase/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}
```

### Étape 10 : Commit des Changements

```bash
git add .
git commit -m "Feat: Initialize Ionic project with Vue.js and Firebase SDK (Tasks 56-57)"
git push origin main
```

### ✅ Tâche 57 Complétée

À ce stade, vous avez:
- ✅ Firebase SDK installé et configuré
- ✅ Un composable réutilisable pour Firebase
- ✅ Les credentials sécurisés dans un fichier `.env`
- ✅ Un test d'authentification fonctionnel
- ✅ Une base solide pour les tâches futures (Tâche 58-66)

---

## 🔍 Checklist de Validation

Avant de marquer les tâches comme complétées:

### Tâche 56 - Ionic Setup
- [ ] Projet Ionic créé avec `ionic start`
- [ ] Vue.js activé comme framework
- [ ] Dépendances installées (`npm install`)
- [ ] Serveur de développement fonctionne (`ionic serve`)
- [ ] Pas d'erreurs de compilation

### Tâche 57 - Firebase Configuration
- [ ] Firebase SDK installé (`npm install firebase`)
- [ ] Fichier de configuration créé (`src/firebase/firebase.ts`)
- [ ] Composable Firebase créé (`src/composables/useFirebase.ts`)
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Authentification testée et fonctionnelle
- [ ] Code versionnez dans Git

---

## 📚 Ressources Utiles

- [Ionic Vue Documentation](https://ionicframework.com/docs/vue/overview)
- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Vue.js 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ⚠️ Dépannage

### Problème: `ionic: command not found`
**Solution**: Réinstallez Ionic CLI
```bash
npm install -g @ionic/cli
```

### Problème: Erreur Firebase - "Invalid API Key"
**Solution**: Vérifiez que vos credentials Firebase sont correctes et que le projet Firebase est activé.

### Problème: Port 8100 déjà utilisé
**Solution**: Utilisez un port différent
```bash
ionic serve --port 3000
```

### Problème: Module Vue non trouvé
**Solution**: Vérifiez les imports dans les fichiers Vue
```bash
npm install
```

---

## 📝 Notes pour les Tâches Suivantes

Une fois ces deux tâches complétées, vous êtes prêt pour:
- **Tâche 58**: Installation et configuration de Leaflet pour Vue.js
- **Tâche 59**: Écran de connexion Firebase
- **Tâche 60-64**: Intégration des cartes, géolocalisation, et signalements

Conservez le fichier `.env` en sécurité et ne le commitez jamais dans Git!

---

**Fin du guide - Tâches 56 et 57**
