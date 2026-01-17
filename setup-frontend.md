# Installation et Configuration du Frontend React

## Prérequis
- Node.js 18+ installé
- Docker et Docker Compose installés
- PowerShell

## Étape 1: Créer le projet React

Ouvrez PowerShell et naviguez vers le dossier du projet:

```powershell
# Se positionner dans le dossier front_end_web
cd 'c:\Users\lovan\Documents\S5\Mr Rojo\ProjetS5\gith\Projet_Cloud_S5\front_end_web'

# Recommandé — Vite (léger et moderne). Fonctionne si vous n'avez que `npm`:
npm create vite@latest . -- --template react
npm install

# Pour développement local (Vite):
npm run dev

# Si vous préférez Create React App (moins recommandé — déprécié):
# Avec npx (si disponible):
npx create-react-app .
# Ou avec npm uniquement:
npm init react-app .
# Ou installer globalement:
npm install -g create-react-app
create-react-app .
```

**Note:** Si le dossier n'est pas vide, Create React App vous demandera confirmation. Acceptez avec `y`.

## Étape 2: Créer le Dockerfile de production

Toujours dans le dossier `front_end_web`, créez le `Dockerfile`:

```powershell
# Créer le Dockerfile avec un build multi-stage (Node + Nginx)
@"
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"@ | Out-File -Encoding UTF8 Dockerfile
```

**Ou créez manuellement le fichier `Dockerfile` avec ce contenu:**

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Étape 3: Configurer l'URL du backend (optionnel)

Pour que React communique avec le backend, créez un fichier `.env` dans `front_end_web`:

```powershell
# Créer le fichier .env
@"
REACT_APP_API_URL=http://localhost:8080
"@ | Out-File -Encoding UTF8 .env
```

## Étape 4: Créer un fichier .dockerignore

Pour optimiser le build Docker:

```powershell
# Créer .dockerignore
@"
node_modules
npm-debug.log
.git
.gitignore
README.md
.env.local
.env.development.local
.env.test.local
.env.production.local
"@ | Out-File -Encoding UTF8 .dockerignore
```

## Étape 5: Lancer l'application avec Docker Compose

Retournez à la racine du projet:

```powershell
# Revenir à la racine du projet
cd ..

# Construire et lancer tous les services
docker-compose up --build
```

## Étape 6: Vérifier que tout fonctionne

Une fois les conteneurs démarrés, accédez aux services:

- **Frontend Web**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Base de données**: localhost:5432
- **Serveur de cartes**: http://localhost:8081

## Commandes utiles

```powershell
# Arrêter les conteneurs
docker-compose down

# Relancer sans rebuild
docker-compose up

# Voir les logs d'un service spécifique
docker-compose logs frontend_web

# Reconstruire un seul service
docker-compose up --build frontend_web

# Supprimer les volumes (réinitialiser la base de données)
docker-compose down -v
```

## Développement local (sans Docker)

Si vous voulez développer localement sans Docker:

```powershell
# Dans front_end_web
cd front_end_web
npm start
```

L'application sera disponible sur http://localhost:3000 avec le hot-reload activé.

## Dépannage

### Problème: Le dossier n'est pas vide
Si `create-react-app` refuse de s'installer, videz le dossier ou utilisez:
```powershell
npx create-react-app frontend-temp
Move-Item frontend-temp/* front_end_web/
Remove-Item frontend-temp
```

### Problème: Port 3000 déjà utilisé
Modifiez le port dans `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Au lieu de 3000:80
```

### Problème: Erreurs de build Docker
Nettoyez le cache Docker:
```powershell
docker-compose down
docker system prune -a
docker-compose up --build
```
