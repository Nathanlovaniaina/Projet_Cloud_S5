# Projet_Cloud_S5

Projet Signalement Travaux Routiers - Cloud S5

## Architecture

- **Backend**: Java Spring Boot API
- **Base de données**: PostgreSQL
- **Frontend Web**: React avec Leaflet
- **Frontend Mobile**: Ionic Vue.js
- **Cartes**: Serveur de tiles OpenStreetMap offline

## Démarrage avec Docker

Assurez-vous d'avoir Docker et Docker Compose installés.

```bash
docker-compose up --build
```

Services disponibles:
- Base de données: http://localhost:5432
- Backend API: http://localhost:8080
- Frontend Web: http://localhost:3000
- Serveur de cartes: http://localhost:8081

