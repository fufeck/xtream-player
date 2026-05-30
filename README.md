# Xtream Player

Lecteur IPTV pour **LG webOS TV** basé sur le protocole Xtream Codes. Construit avec [Enact Sandstone](https://enactjs.com/) (React 18, TypeScript 5).

## Fonctionnalités

- **Authentification** — Connexion via identifiants Xtream (host, username, password), persistés en localStorage.
- **Navigation par catégorie** — Chaînes TV en direct, Films et Séries dans des vues dédiées.
- **Filtre par groupe** — Panneau latéral (25% gauche) avec la liste des groupes Xtream (ex. Sports, Cinéma). Filtre combinable avec la recherche textuelle.
- **Favoris** — Long press OK (700 ms) sur un item pour l'ajouter/retirer des favoris. Indicateur ★ doré sur chaque item favori. Filtre "Favoris" dans le panneau latéral. Persistance en localStorage.
- **Lecture vidéo** — Lecture des lives, films et épisodes de séries via `@enact/sandstone/VideoPlayer`.
- **Navigation TV** — Entièrement pilotable à la télécommande via Enact Spotlight (5-way navigation).

## Prérequis

### Pour le développement local (`npm run serve`)

- **Node.js** ≥ 18 LTS (testé avec v24)
- **npm** ≥ 9

```bash
npm install
npm run serve   # http://localhost:8080
```

### Pour déployer sur une TV LG webOS

En plus de Node.js, installer les outils CLI webOS :

```bash
npm install -g @webosose/ares-cli
```

Vérifier l'installation :

```bash
ares-setup-device --version
```

#### Étapes de déploiement

1. **Activer le mode développeur** sur la TV :
   [https://webostv.developer.lge.com/develop/getting-started/developer-mode-app](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app)

2. **Builder l'app** :
   ```bash
   npm run pack-p        # Build production → dist/
   ```

3. **Packager l'IPK** :
   ```bash
   ares-package dist/    # Génère com.fabien.xtream-player_1.0.0_all.ipk
   ```

4. **Enregistrer la TV** (une seule fois, IP de la TV en mode dev) :
   ```bash
   ares-setup-device
   ```

5. **Installer sur la TV** :
   ```bash
   ares-install com.fabien.xtream-player_1.0.0_all.ipk
   ```

6. **Lancer l'app** :
   ```bash
   ares-launch com.fabien.xtream-player
   ```

## Structure du projet

```
src/
├── App/
│   └── App.tsx              # Routing HashRouter + AuthGate
├── components/
│   ├── CategoryFilter.tsx   # Filtre latéral partagé (groupes + favoris + recherche)
│   └── PosterCard.tsx       # Carte poster custom (Spottable, focus doré)
├── context/
│   └── AppContext.tsx       # State global : channels[], loading, error, refresh()
├── services/
│   ├── credentialsService.ts  # localStorage xtream_credentials
│   ├── favoritesService.ts    # localStorage xtream_favorites (getFavoriteIds, toggleFavorite)
│   ├── playlistService.ts     # Chargement playlist + normalisation Channel[]
│   └── xtreamApi.ts           # Appels HTTP Xtream API
├── types/
│   └── index.ts             # Channel, CategoryType, Credentials, types Xtream raw
└── views/
    ├── HomePanel.tsx        # Accueil — 3 catégories + logout
    ├── LivePanel.tsx        # Liste des chaînes TV en direct
    ├── LoginPanel.tsx       # Formulaire de connexion
    ├── PlayerPanel.tsx      # Lecteur vidéo (lives / films / séries)
    ├── PosterPanel.tsx      # Grille films ou séries
    └── SeriePanel.tsx       # Liste des épisodes d'une série
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run serve` | Dev server avec hot reload sur http://localhost:8080 |
| `npm run pack` | Build développement → `dist/` |
| `npm run pack-p` | Build production minifié → `dist/` |
| `npm run lint` | ESLint (règles Enact) |
| `npm run test` | Tests Jest |
| `npm run clean` | Supprime `dist/` |
