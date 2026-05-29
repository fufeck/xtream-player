# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

For Enact/Sandstone API reference and best practices, see [`.claude/enact-llms.md`](.claude/enact-llms.md).

## Commands

```bash
npm run serve      # Dev server on http://localhost:8080 (hot reload)
npm run pack       # Development build → dist/
npm run pack-p     # Production build (minified) → dist/
npm run lint       # ESLint with Enact rules
npm run test       # Run all tests (Jest)
npm run clean      # Delete dist/
```

## ESLint constraints (enact-proxy)

- **`react-hooks/set-state-in-effect`** — `setState` is forbidden synchronously inside `useEffect`. All state updates must be inside `.then()` / `.catch()`. See `AuthGate` in `src/App/App.tsx`.
- **`react/jsx-no-bind`** — No arrow functions as JSX props. Always use `useCallback`.

## Architecture

**Target platform:** LG webOS TV — Enact Sandstone, React 18, TypeScript 5, resolution-independent at 1920×1080 via `ri.scale()`.

### Authentication flow

Credentials `{ host, username, password }` are stored in `localStorage` under the key `xtream_credentials` (`src/services/credentialsService.ts`).

On every load (`/`), `AuthGate` in `src/App/App.tsx` validates the stored credentials. Invalid or missing → `/login`, valid → `/home`.

### Data flow

```
HomePanel (mount)
  └─ AppContext.refresh()
       └─ playlistService.loadPlaylist()
            └─ xtreamApi — 6 parallel calls (3 category lists + 3 stream lists)
            └─ normalize → Channel[]
  └─ channels[] available via useApp() in all panels
```

No cache — playlist is always fetched fresh on `/home` mount.

### Routing (react-router-dom v7, HashRouter)

| Route | Component |
|-------|-----------|
| `/` | `AuthGate` — validates credentials |
| `/login` | `LoginPanel` |
| `/home` | `HomePanel` — 3 category cards + logout |
| `/lives` | `MainPanel category="tv"` |
| `/movies` | `MainPanel category="films"` |
| `/series` | `MainPanel category="series"` |
| `/series/:series_id` | `SeriesDetailPanel` |
| `/lives/player/:stream_id` | `PlayerPanel type="lives"` |
| `/movies/player/:stream_id` | `PlayerPanel type="movies"` |
| `/series/player/:stream_id` | `PlayerPanel type="series"` |

### Key types (`src/types/index.ts`)

```ts
type CategoryId = 'tv' | 'films' | 'series'
type PlayerType = 'lives' | 'movies' | 'series'

interface Channel {
  id: string; name: string; logo: string; group: string;
  url: string | null; category: CategoryId; series_id?: number;
}
```

### TypeScript notes

- Strict mode, ES5 target, `moduleResolution: node`
- Several Enact props are absent from shipped `.d.ts` files — patched in `types/enact-augmentations.d.ts` via module augmentation (`export {}` required to augment rather than replace)
- `Set` spread is unsupported at ES5 target — use `Array.from(new Set(...))`
