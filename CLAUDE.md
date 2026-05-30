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

**Important:** Use `@enact/sandstone/Image` instead of `<img>` — native `<img>` tags do not work reliably on webOS TV.

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
| `/lives` | `LivePanel` — searchable list of live channels |
| `/movies` | `PosterPanel category="movies"` — grid of movies |
| `/series` | `PosterPanel category="series"` — grid of series |
| `/series/:series_id` | `SeriePanel` — episode list grouped by season |
| `/lives/player/:stream_id` | `PlayerPanel type="lives"` |
| `/movies/player/:stream_id` | `PlayerPanel type="movies"` |
| `/series/player/:stream_id` | `PlayerPanel type="series"` |

### Key types (`src/types/index.ts`)

```ts
type CategoryType = 'lives' | 'movies' | 'series'

interface Channel {
  id: string; name: string; logo: string; group: string;
  url: string | null; category: CategoryType; series_id?: number;
}
```

`group` stores the Xtream category name (e.g. "Sports", "Cinéma"). It is used for the category filter UI.

### Services (`src/services/`)

| File | Purpose |
|------|---------|
| `credentialsService.ts` | Read/write credentials in `localStorage['xtream_credentials']` |
| `xtreamApi.ts` | HTTP calls to the Xtream API (`/player_api.php`) |
| `playlistService.ts` | Orchestrates API calls, normalizes data to `Channel[]`. Exports `extractGroups(channels)` to get sorted unique group names. |
| `favoritesService.ts` | Read/write favorite channel IDs in `localStorage['xtream_favorites']`. Exports `getFavoriteIds()` and `toggleFavorite(id)`. |

### Components (`src/components/`)

#### `CategoryFilter`

Shared filter panel used by `LivePanel` and `PosterPanel`. Renders on the left (25% width) alongside the content list/grid (75%).

Props:
```ts
interface CategoryFilterProps {
  groups: string[];          // list of Xtream group names
  selectedGroup: string | null; // '__favorites__' | group name | null (all)
  onSelectGroup: (group: string | null) => void;
  query: string;
  onQueryChange: ({ value }: { value: string }) => void;
  placeholder?: string;
}
```

The sentinel value `'__favorites__'` is used to activate the favorites filter — handled in each panel's `filteredChannels` useMemo.

#### `PosterCard`

Custom Spottable card with focus/selected styling (gold border `#e6b655`). Used for custom poster displays.

### Favorites system

- **Add/remove:** Long press the OK/Enter key (700 ms) on any channel item → `toggleFavorite(channel.id)` is called, navigation is blocked.
- **Display:** A `favoritesVersion` state counter forces `filteredChannels` and `favoriteIds` useMemos to recompute after each toggle.
- **Indicator:** `LivePanel` shows a gold ★ via `slotAfter` on `Item`; `PosterPanel` shows a gold ★ via an absolutely-positioned overlay on the poster wrapper div.
- **Filter:** Selecting "Favoris" in `CategoryFilter` sets `selectedGroup = '__favorites__'`, which filters channels by `getFavoriteIds()`.

### Long press pattern (LivePanel / PosterPanel)

```ts
const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const longPressActiveRef = useRef(false);

// onKeyDown: start 700ms timer
// onKeyUp:   cancel timer if still running
// onClick:   skip navigation if longPressActiveRef.current is true
```

### TypeScript notes

- Strict mode, ES5 target, `moduleResolution: node`
- `Set` spread is unsupported at ES5 target — use `Array.from(new Set(...))`
- Some Enact props are absent from shipped `.d.ts` — use `as ComponentType<Props & { extraProp }>` casts at module level rather than interface augmentation (merging cannot change an existing property's type)
- `ImageItem.children` is typed as `string` — to pass JSX overlays, cast: `const ImageItemWithChildren = ImageItem as ComponentType<ComponentProps<typeof ImageItem> & { children?: ReactNode }>`
