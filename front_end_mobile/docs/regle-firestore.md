# task 59 
Exemple (production — lecture seule pour le propriétaire) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /utilisateurs/{docId} {
      // Seul le propriétaire (utilisateur authentifié dont l'uid === docId
      // ou dont resource.data.firebase_uid === request.auth.uid) peut lire
      allow read: if request.auth != null && (
        request.auth.uid == docId || resource.data.firebase_uid == request.auth.uid
      );
      // Ecrire depuis le client est interdit (faites les mises à jour via backend
      // si besoin et vérifiez les droits côté serveur)
      allow write: if false;
    }
  }
}
```

Exemple (développement — permissif, pour tests locaux seulement) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /utilisateurs/{docId} {
      allow read: if request.auth != null; // dev only - do not use in production
      allow write: if false;
    }
  }
}