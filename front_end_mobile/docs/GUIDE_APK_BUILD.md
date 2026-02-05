# Guide Complet : Génération de l'APK Android

Ce guide détaille les étapes pour configurer et générer l'APK Android final de l'application mobile Ionic Vue.js.

## Vue d'ensemble du projet

Le projet front_end_mobile est composé de :
- **Framework** : Ionic 8 + Vue 3
- **Build Tool** : Vite
- **Mobile Platform** : Capacitor + Android
- **Authentification** : Firebase
- **Cartes** : Leaflet + OpenStreetMap
- **Géolocalisation** : Capacitor Geolocation
- **SDK Android** : Configuré en local.properties
- **Configuration Gradle** : Android Gradle 8.13.0

---

## Tâche 65 : Configuration pour la génération de l'APK Android

### 📋 Étape 1 : Vérifier les prérequis

#### 1.1 Android SDK
L'Android SDK est déjà configuré dans `local.properties` :
```
sdk.dir=C:\Users\Mamisoa\AppData\Local\Android\Sdk
```

Vérifier que le SDK est correctement installé :
- Ouvrir Android Studio
- **Settings** → **Languages & Frameworks** → **Android SDK**
- Vérifier que les versions suivantes sont installées :
  - SDK 36 (compileSdkVersion, targetSdkVersion)
  - SDK 24+ (minSdkVersion)
  - Build Tools 36
  - Android Emulator ou connexion avec un appareil physique

#### 1.2 Java et Gradle
```powershell
# Vérifier la version de Java
java -version

# Vérifier Gradle
.\android\gradlew -v
```

**Versions recommandées** :
- Java : 11 ou supérieur
- Gradle : 8.13.0 (déjà configuré)

#### 1.3 Dépendances Node.js
```powershell
cd .\front_end_mobile\

# Vérifier les dépendances
npm list @capacitor/android @capacitor/cli

# Installer/mettre à jour si nécessaire
npm install
```

### 📋 Étape 2 : Mettre à jour le capacitor.config.ts

Le fichier `capacitor.config.ts` définit l'identifiant et le nom de l'application :

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signalement.travaux',     // Format : com.domaine.appname
  appName: 'Signalement Travaux',       // Nom affiché sur l'écran d'accueil
  webDir: 'dist'
};

export default config;
```

**À faire** :
```typescript
const config: CapacitorConfig = {
  appId: 'com.signalement.travaux',     // Format : com.domaine.appname
  appName: 'Signalement Travaux',       // Nom affiché sur l'écran d'accueil
  webDir: 'dist'
};
```

### 📋 Étape 3 : Configurer le fichier google-services.json

Le fichier `android/app/google-services.json` doit être configuré correctement pour Firebase.

**Vérifier que le fichier existe** :
```
front_end_mobile/android/app/google-services.json
```

**Contenu du fichier** (exemple structuré) :
```json
{
  "type": "service_account",
  "project_id": "votre-projet-firebase",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "firebase-...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Si le fichier est manquant** :
1. Aller à [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Aller dans **Project Settings** (⚙️)
4. Aller dans l'onglet **Service Accounts**
5. Cliquer sur **Generate New Private Key**
6. Placer le fichier JSON téléchargé dans `android/app/google-services.json`

### 📋 Étape 4 : Configurer les variables de signature APK

Créer un fichier `android/signing.properties` pour la signature APK :

```properties
# Chemin vers le keystore
storeFile=C:\\Users\\Mamisoa\\Documents\\keystore\\signalement.jks
storePassword=votre_mot_de_passe
keyAlias=signalement
keyPassword=votre_mot_de_passe
```

**Générer un keystore** (si inexistant) :
```powershell
# Créer le répertoire
mkdir C:\Users\Mamisoa\Documents\keystore

# Générer le keystore (valide 10 ans)
keytool -genkey -v -keystore C:\Users\Mamisoa\Documents\keystore\signalement.jks `
  -keyalg RSA -keysize 2048 -validity 3650 -alias signalement

# Vérifier le keystore
keytool -list -v -keystore C:\Users\Mamisoa\Documents\keystore\signalement.jks
```

### 📋 Étape 5 : Mettre à jour la configuration Gradle

Éditer `android/app/build.gradle` pour ajouter la signature APK :

**Trouver la section `buildTypes`** et remplacer par :
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        
        signingConfig signingConfigs.release
    }
    debug {
        debuggable true
    }
}
```

**Ajouter la section `signingConfigs` avant `buildTypes`** :
```gradle
def signingPropertiesFile = rootProject.file('signing.properties')
def signingProperties = new Properties()
if (signingPropertiesFile.exists()) {
    signingProperties.load(new FileInputStream(signingPropertiesFile))
}

signingConfigs {
    release {
        storeFile signingProperties.storeFile ? file(signingProperties.storeFile) : null
        storePassword signingProperties.storePassword
        keyAlias signingProperties.keyAlias
        keyPassword signingProperties.keyPassword
    }
}
```

### 📋 Étape 6 : Vérifier la configuration des permissions Android

Le fichier `android/app/src/AndroidManifest.xml` doit inclure les permissions nécessaires :

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions requises -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Capacitor Bridge Activity -->
    <application
        android:allowBackup="true"
        android:debuggable="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">
        
        <activity
            android:name="com.signalement.travaux.MainActivity"
            android:exported="true"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 📋 Étape 7 : Vérifier la configuration de version

Éditer `android/app/build.gradle` - section `defaultConfig` :

```gradle
defaultConfig {
    applicationId "com.signalement.travaux"
    minSdkVersion 24
    targetSdkVersion 36
    compileSdkVersion 36
    versionCode 1
    versionName "1.0.0"
    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
}
```

**Note** : À chaque nouvelle build :
- Incrémenter `versionCode` (1, 2, 3...)
- Mettre à jour `versionName` (1.0.0, 1.0.1, 1.1.0...)

---

## Tâche 66 : Génération et test de l'APK final

### 🔨 Étape 1 : Build Web (Vite)

Avant de générer l'APK, il faut compiler l'application Vue.js en fichiers statiques :

```powershell
cd .\front_end_mobile\

# Installer les dépendances (si pas fait)
npm install

# Build pour la production
npm run build
```

**Vérifier** que le dossier `dist` a été créé avec les fichiers compilés.

### 🔨 Étape 2 : Synchroniser avec Capacitor

Copier les fichiers build web vers le projet Android :

```powershell
# À partir de ./front_end_mobile/
npx cap sync android
```

Cela met à jour :
- Les fichiers web dans `android/app/src/main/assets/public`
- Les dépendances Capacitor
- Les fichiers de configuration

### 🔨 Étape 3 : Générer l'APK Debug avec Android Studio

#### 3.1 Ouvrir le projet Android dans Android Studio

```
1. Ouvrir Android Studio
2. File → Open
3. Sélectionner le dossier : front_end_mobile/android/
4. Cliquer sur "OK"
```

Android Studio chargera le projet (cela peut prendre quelques minutes la première fois).

#### 3.2 Générer l'APK Debug

```
1. Menu principal → Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Attendre la compilation (vous verrez une barre de progression)
3. Une notification apparaîtra : "Build successful"
```

**Localiser l'APK généré** :
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### 3.3 Tester l'APK Debug immédiatement

Android Studio propose une option directe pour installer et lancer :

```
1. Une fois le build terminé, un popup apparaît
2. Cliquer sur "Run" pour installer et lancer l'app
3. Sélectionner l'appareil (émulateur ou device physique)
4. Android Studio installera et lancera l'app automatiquement
```

**Alternative - Installation manuelle** :
```
1. Dans Android Studio : View → Tool Windows → Device File Explorer
2. Naviguer vers : /data/app/
3. Ou utiliser le terminal intégré :
   - Terminal → adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 🔨 Étape 4 : Générer l'APK Release avec Android Studio

#### 4.1 Configurer les credentials de signature (si nécessaire)

Avant de générer le Release, Android Studio doit connaître votre keystore.

```
1. Menu principal → Build → Generate Signed Bundle / APK
2. Sélectionner "APK"
3. Cliquer sur "Next"
```

#### 4.2 Configurer le Keystore

Une fenêtre "Signing" apparaîtra :

**Si c'est la première fois** :
```
1. Cliquer sur le bouton "..." à côté de "Key store path"
2. Chercher votre keystore (C:\Users\Mamisoa\Documents\keystore\signalement.jks)
3. Entrer le "Key store password" (mot de passe du keystore)
4. Sélectionner l'alias (signalement)
5. Entrer le "Key password" (mot de passe de la clé)
6. Cliquer "OK"
```

**Si vous avez déjà configuré** :
```
1. Les champs seront pré-remplis
2. Entrer juste les mots de passe si nécessaire
3. Cliquer "Next"
```

#### 4.3 Sélectionner le type de Release

Une fenêtre "Flavors" / "Build Variants" apparaîtra :

```
1. Vérifier que "release" est sélectionné
2. Cliquer "Finish"
3. Attendre la compilation (peut prendre 1-2 minutes)
4. Une notification "Build successful" s'affichera
```

**L'APK Release signé sera généré à** :
```
android/app/release/app-release.apk
```

#### 4.4 Vérifier l'APK généré

Android Studio affichera un popup avec un lien pour localiser le fichier :

```
1. Cliquer sur "locate" dans le popup
2. Ou naviguer manuellement vers : android/app/release/
```

### 🔨 Étape 5 : Tester l'APK Release

#### 5.1 Installer sur un appareil avec Android Studio

**Méthode la plus simple - Run Configuration** :

```
1. Connecter votre appareil Android ou lancer un émulateur
2. Menu : Run → Run 'app'
3. Sélectionner l'appareil dans la fenêtre "Select Deployment Target"
4. Android Studio installera et lancera l'app automatiquement
```

#### 5.2 Installer sur un émulateur

**Option A - Depuis Android Studio** :
```
1. Tools → Device Manager
2. Si aucun émulateur : Cliquer sur "Create Device"
3. Sélectionner un profil (Pixel 5, API 31+)
4. Cliquer "Create"
5. Lancer l'émulateur (bouton Play)
6. Menu Run → Run 'app' → Sélectionner l'émulateur
```

**Option B - Depuis la ligne de commande** :
```powershell
# Lancer l'émulateur
emulator -avd Pixel_5_API_31

# Dans VS Code, installer l'APK
adb install -r android/app/release/app-release.apk

# Lancer l'app
adb shell am start -n com.signalement.travaux/.MainActivity
```

#### 5.3 Installer sur un appareil physique

**Préparation** :
```
1. Connecter l'appareil Android via USB
2. Sur l'appareil :
   - Aller à Paramètres → À propos du téléphone
   - Appuyer 7 fois sur "Numéro de build" (pour activer mode développeur)
   - Aller à Paramètres → Options pour développeurs
   - Activer "Débogage USB"
3. Revenir à Android Studio
4. Tools → Device Manager (l'appareil doit s'afficher)
```

**Installation et test** :
```
1. Menu : Run → Run 'app'
2. Sélectionner l'appareil physique dans "Select Deployment Target"
3. Cliquer "OK"
4. Android Studio installera et lancera l'app
```

**Alternative - Installation manuelle** :
```powershell
# Vérifier la connexion
adb devices

# Installer l'APK
adb install -r android/app/release/app-release.apk

# Lancer l'app
adb shell am start -n com.signalement.travaux/.MainActivity
```

#### 5.4 Voir les logs en temps réel

Pendant que l'app est en cours d'exécution :

```
1. Android Studio → View → Tool Windows → Logcat
2. Filtrer par votre app : rechercher "signalement" ou "MainActivity"
3. Vous verrez tous les logs en temps réel
4. En cas d'erreur, chercher "ERROR" ou "Exception"
```

### 🧪 Étape 6 : Tests de fonctionnalité

Tester les fonctionnalités clés dans l'APK :

**Checklist de test** :
- ✓ L'application démarre sans erreur
- ✓ Écran de connexion Firebase affiche correctement
- ✓ Connexion Firebase fonctionne (test avec compte valide)
- ✓ Carte Leaflet s'affiche avec les signalements
- ✓ Géolocalisation fonctionne (localiser l'utilisateur)
- ✓ Création d'un signalement fonctionne
- ✓ Filtre "Mes signalements" fonctionne
- ✓ Synchronisation des données fonctionne
- ✓ Interface responsive sur différentes tailles d'écran
- ✓ Pas d'erreurs console dans les logs

**Voir les logs** :
```powershell
adb logcat | findstr "MainActivity"
```

### 📊 Étape 7 : Vérifier et optimiser

#### 7.1 Taille de l'APK
```powershell
# Vérifier la taille
(Get-Item "android/app/build/outputs/apk/release/app-release.apk").Length / 1MB
```

**Optimisations si nécessaire** :
- Activer la minification (déjà configurée)
- Activer la compression des ressources
- Réduire les images dans les assets

#### 7.2 Performance
- Vérifier le temps de démarrage
- Monitorer l'utilisation mémoire (ADB Monitor ou Android Studio Profiler)
- Vérifier qu'il n'y a pas de memory leaks

#### 7.3 Build System
```powershell
# Analyser le build (détails des dépendances, ressources)
.\gradlew build --scan
```

---

## 🚀 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run build` | Compiler l'app Vue en production |
| `npx cap sync android` | Synchroniser avec le projet Android |
| `.\gradlew clean` | Nettoyer les builds précédentes |
| `.\gradlew assembleDebug` | Générer APK debug |
| `.\gradlew assembleRelease` | Générer APK release |
| `adb install app.apk` | Installer APK sur device |
| `adb logcat` | Voir les logs |
| `adb devices` | Lister les appareils connectés |

---

## ⚠️ Dépannage

### Problème : "Could not find method google-services"
**Solution** : Vérifier que `google-services.json` existe dans `android/app/`

### Problème : "Gradle build failed - targetSdkVersion"
**Solution** : Vérifier `variables.gradle` et `local.properties`

### Problème : "Permission denied for gradle wrapper"
**Solution** (Windows) : Le wrapper devrait fonctionner directement

### Problème : "Firebase not initialized"
**Solution** : Vérifier que `google-services.json` est valide et configuré dans Gradle

### Problème : "APK installation failed on device"
**Solution** :
```powershell
adb uninstall com.signalement.travaux    # Désinstaller l'ancienne version
adb install app-release.apk              # Réinstaller
```

### Problème : "Carte ne charge pas"
**Solution** : Vérifier que Firebase est authentifié et que l'API REST backend fonctionne

---

## 📝 Résumé des fichiers clés

| Fichier | Purpose |
|---------|---------|
| `capacitor.config.ts` | Configuration Capacitor (appId, appName) |
| `android/app/build.gradle` | Configuration build Gradle, signature APK |
| `android/variables.gradle` | Versions SDK Android |
| `android/local.properties` | Chemin Android SDK |
| `android/signing.properties` | Credentials de signature (non committé) |
| `android/app/google-services.json` | Configuration Firebase |
| `android/app/src/AndroidManifest.xml` | Permissions et configuration Android |

---

## ✅ Checklist Finale

Avant de déployer en production :

- [ ] Tâche 65 - Configuration complète
  - [ ] capacitor.config.ts personnalisé
  - [ ] google-services.json configuré
  - [ ] signing.properties créé avec keystore
  - [ ] build.gradle avec signature release
  - [ ] AndroidManifest.xml avec permissions
  - [ ] Versions SDK alignées (compileSdk 36, targetSdk 36, minSdk 24)

- [ ] Tâche 66 - Génération et tests
  - [ ] Build web réussi (`npm run build`)
  - [ ] Synchronisation Capacitor réussie (`npx cap sync android`)
  - [ ] APK Debug généré et testé
  - [ ] APK Release généré et testé
  - [ ] Tests fonctionnels passés (login, carte, signalements)
  - [ ] Logs vérifiés (aucune erreur critique)
  - [ ] Taille APK acceptable

---

## 📚 Ressources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Ionic Build for Android](https://ionicframework.com/docs/deployment/android)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Android Gradle Build System](https://developer.android.com/build)
