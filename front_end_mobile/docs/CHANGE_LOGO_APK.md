# Étapes pour Modifier le Logo de l'APK Mobile

## Introduction
Ce guide explique comment modifier le logo de l'application mobile dans un projet Ionic/Capacitor. Le logo est utilisé comme icône de l'application et peut être vu sur l'écran d'accueil et dans le tiroir des applications.

---

## Prérequis
- Avoir Node.js et npm installés.
- Avoir Android Studio installé.
- Avoir configuré l'environnement de développement pour Ionic/Capacitor.
- Le fichier de logo souhaité (format PNG, idéalement carré, par exemple 512x512 pixels).

---

## Étapes

### 1. Préparer l'Image de Base
1. Créez une image carrée (par exemple, 512x512 pixels) au format PNG.
2. Placez cette image dans un dossier nommé `resources` à la racine de votre projet.

### 2. Installer le Plugin `cordova-res`
1. Installez le plugin globalement :
   ```bash
   npm install -g cordova-res
   ```

### 3. Générer les Icônes
1. Exécutez la commande suivante pour générer les icônes :
   ```bash
   cordova-res android --skip-config --copy
   ```
2. Cette commande :
   - Génère automatiquement les icônes pour toutes les résolutions nécessaires.
   - Remplace les anciennes icônes dans le dossier `android/app/src/main/res/`.

### 4. Nettoyer et Recompiler le Projet
1. Nettoyez le projet Android :
   ```bash
   cd android
   ./gradlew clean
   ```
2. Retournez à la racine du projet et synchronisez les modifications Capacitor :
   ```bash
   npx cap sync android
   ```
3. Ouvrez Android Studio et vérifiez que les icônes sont correctement affichées.

### 5. Construire l'APK
1. Dans Android Studio, sélectionnez `Build > Build Bundle(s)/APK(s) > Build APK(s)`.
2. Une fois la construction terminée, récupérez l'APK dans le dossier `android/app/build/outputs/apk/`.

---

## Conseils
- Utilisez des outils comme [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) pour générer des icônes adaptées à toutes les résolutions.
- Testez l'APK sur un appareil physique ou un émulateur pour vérifier que le logo s'affiche correctement.

---

## Conclusion
En suivant ces étapes, vous pouvez facilement modifier le logo de votre application mobile et générer un nouvel APK avec les modifications appliquées.