# Siftly

Siftly is a front-end-only smart job-search launcher. You type a few simple
inputs — titles, location, remote preference, salary, freshness — and Siftly
generates precise search-engine links aimed straight at employer applicant
tracking systems (ATS) and job sites. It then helps you track the jobs you
find on a Kanban board.

**No backend. No database. No scraping. No external APIs.** The app only
builds search-engine URLs that open in a new tab. Everything else — saved
searches, tracker cards, history, preferences — lives in your browser
(IndexedDB, with a localStorage and in-memory fallback).

## Quick start

```bash
bun install        # or: npm install
bun run dev        # or: npm run dev  → http://localhost:3000
```

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `dev`               | Vite dev server on port 3000                    |
| `build`             | `tsc --noEmit` + production build (+ PWA assets)|
| `preview`           | Serve the production build                      |
| `test`              | Vitest run (1,158 tests incl. URL snapshots)    |
| `test:update`       | Re-generate URL snapshots after changing output |
| `lint`              | ESLint                                          |
| `format`            | Prettier                                        |

## Architecture

```
src/
├── core/                  Pure domain logic — no UI, no IO
│   ├── types.ts           SearchParams, RemotePref, Freshness…
│   ├── sources.ts         Source registry (data, not code)
│   ├── engines.ts         One adapter per search engine
│   ├── queryBuilder.ts    Canonical query: site:… (A OR B) "loc" …
│   ├── presets.ts         Region presets + per-engine region params
│   ├── booleanBuilder.ts  Visual AND/OR/NOT spec → boolean string
│   ├── share.ts           #s=<base64url(json)> codec (Unicode-safe)
│   └── csv.ts             RFC 4180 helpers (BOM included for Excel)
├── state/                 Zustand stores (persisted via appStorage)
│   ├── searchStore.ts     Form, results, history (last 20), saved searches
│   ├── trackerStore.ts    Kanban cards + move semantics
│   ├── prefs.ts           Theme, language, onboarding flag
│   └── toastStore.ts      Toast notifications
├── storage/storage.ts     IndexedDB → localStorage → memory fallback
├── i18n/                  en / fr / ar dictionaries + provider (RTL)
├── ui/                    Design system: Button, Chip, Modal, Toasts…
└── features/
    ├── search/            Form, results grid, sources manager, boolean helper
    ├── tracker/           Kanban board (dnd-kit), card editor
    ├── saved/             Library: saved searches, history, import/export
    └── presets/           Region select
```

Data flow: **form → `currentParams()` → `buildSourceQuery(params, source)`
per active source → `engine.buildUrl(query, freshness, region)` → result
row.** Every step is a pure function in `core/`, which is what the test
suite asserts.

## Design system

The UI is an X-style dark theme with its own palette, chosen so it reads as
deliberate rather than copied: a Carbon canvas (`#0A0A0B`), Graphite raised
surfaces (`#141416`), 1px Seam borders (`#26262B`), Chalk text (`#ECECEA`) on
Fog (`#8B8B94`), and one Signal accent (`#3B9EFF`). No gradients, no blur, no
shadows — layering comes from hairline borders and surface steps. Motion is
budgeted: one entrance gesture for modals and toasts, one splash pulse on
load, feedback on drag/copy/save — nothing else, and
`prefers-reduced-motion` disables all of it.

Type is **Schibsted Grotesk** (variable) for the interface and **JetBrains
Mono** for the working data — the job-titles input, every generated query,
domains and deadlines. Queries keep `dir="ltr"` even in the Arabic RTL
layout. The two color scales live in `tailwind.config.ts` (`ink` for dark,
`mist` for light, `brand` for the accent); the shared primitives
(`.surface`, `.input`, `.label`, `.hint`, `.kbd`) live in `src/index.css`.
The brand mark is the Signal-blue sieve tile — regenerate the PWA icons with
`python3 scripts/regen_icons.py`.

Results are deliberately **not** a grid of identical cards: they render as
one divided row per source, and each row carries the literal query string,
the engine and the effective time window — the query is the product.

## Query anatomy

```
site:{DOMAIN} ({T1} OR {T2}) "{LOCATION}" {remote} {salary} {level} {extra}
```

- Titles containing spaces are wrapped in quotes; user-typed quotes are
  stripped first.
- `remote`: exclude → `-remote -"work from home"`, remote-only →
  `(remote OR "work from home")`, include → nothing.
- `salary` (engine-neutral, only when set): `salary $80000-$120000`,
  `salary $80000+`, `salary under $90000`. An inverted range emits nothing.
- Multi-domain sources (e.g. Greenhouse) combine as
  `site:(boards.greenhouse.io OR job-boards.greenhouse.io)`.
- Engines that don't support a freshness window round to the nearest one and
  the row shows a notice; engines with no URL filter at all (Kagi) show a
  different notice and omit the parameter.

## Adding a new search engine

Open `src/core/engines.ts`:

1. Add the id to the `EngineId` union and `ENGINES` array.
2. Define a freshness map (`Partial<Record<Freshness, string>>`) — windows
   missing from the map are rounded automatically; an empty map means
   "unsupported" and the UI shows a notice.
3. Implement the adapter with the `engine()` factory, applying region keys
   it supports from `RegionParams`:

```ts
const foobar = engine('foobar', 'FooBar', 'https://foobar.com/search', (query, freshness, region) => {
  const sp = new URLSearchParams({ q: query });
  const { value, notice } = resolveFreshness(FOOBAR_FRESHNESS, freshness);
  if (value) sp.set('since', value);
  if (region?.gl) sp.set('country', region.gl); // verify in browser
  return { url: `https://foobar.com/search?${sp.toString()}`, notice };
});
```

4. Run `bun run test:update` — the engine joins the engine × source ×
   freshness snapshot matrix automatically. **Verify every freshness and
   region parameter in a real browser before release.**

## Adding a new source

Open `src/core/sources.ts` and append one entry — nothing else changes
(chips, result rows, tests pick it up automatically):

```ts
{
  id: 'myats',            // stable id — never rename
  label: 'MyATS',
  domains: ['jobs.myats.com'],
  category: 'ats',
}
```

Region-specific boards belong in the preset's `extraSources`
(`src/core/presets.ts`); users can also add custom domains at runtime via
**Sources → Manage**.

## Internationalisation

Dictionaries live in `src/i18n/{en,fr,ar}.ts`; `fr` and `ar` are typed as
`typeof en`, so a missing key fails the build **and** the i18n test. Arabic
flips the whole layout to RTL via `document.documentElement.dir`; components
use logical properties (`ms-`, `pe-`, `start-`) throughout. To add a
language: create the dictionary, register it in `LANGUAGES`, extend the
`Lang` type in `state/prefs.ts`.

## Storage & privacy

`src/storage/storage.ts` probes IndexedDB once, falls back to localStorage,
then to memory (with a visible warning banner). Every accessor awaits the
probe, so the persisted Zustand stores always read/write the right backend.
State keys: `siftly.prefs`, `siftly.search`, `siftly.tracker`.

The privacy note — *“Everything stays in your browser.”* — is shown in the
footer, in the onboarding tour, and the app makes no network requests of its
own (opening a result link navigates to the chosen search engine).

## PWA

`vite-plugin-pwa` precaches the full app shell with an auto-updating service
worker, so Siftly installs and works offline. Icons are generated by
`python3 scripts/regen_icons.py` into `public/icons/`.

## Testing

- **URL matrix**: every engine × source × freshness combination (8 × 15 × 9
  = 1,080 URLs + notices) is snapshotted; changing the format requires an
  explicit `test:update`, making regressions reviewable.
- **Edge cases**: empty fields, special characters, curly quotes, Arabic
  input, inverted salary ranges, share-code round trips, CSV round trips
  (BOM, CRLF, embedded newlines), dictionary completeness and `{var}` parity.

## Launch checklist

See [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — it lists every ATS domain
and every freshness/region parameter that must be verified in a real browser
before release.
