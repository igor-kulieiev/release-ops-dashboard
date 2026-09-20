# Release Ops Dashboard

A feature-driven React dashboard for tracking mobile app release status across events: assign an
owner, edit iOS/Android task status, trigger builds, and attach support tickets — all from a
single filterable, shareable-by-URL view.

This is a **portfolio/demo project**. There is no backend: every API call is intercepted in the
browser by [Mock Service Worker](https://mswjs.io/) and served from an in-memory dataset of
fictional events, apps, and owners (`src/mocks/`). It started life as the frontend of a real
internal ops tool and was stripped down to a self-contained demo — the UI, data-fetching, and
optimistic-update logic are unchanged; only the backend and auth were replaced with mocks.

## Why this exists

To show, in one small-but-real feature, how I structure a production React app:

- **Server state lives in TanStack Query**, not component state — queries and mutations own their
  own loading/error/success flow, with optimistic updates (instant UI feedback, roll back on
  failure) for every edit.
- **View state lives in the URL**, not component state — filters, sort, and the open task modal
  are all typed [TanStack Router](https://tanstack.com/router) search params, so every view is a
  shareable link and a refresh never loses your place.
- **One feature module**, not a tangle of global state — `src/modules/releases/` owns its data
  fetching, mutations, and UI end to end; `src/components/ui/` holds the app-agnostic primitives
  it's built from.
- **Radix UI primitives** for anything interactive (dialogs, selects) — behavior comes from the
  primitive, look comes from Tailwind.

See [Architecture](#architecture) below for how the pieces fit together.

## Run it locally

```bash
pnpm install
pnpm dev       # http://localhost:5173
```

No environment variables, no database, no backend to stand up — `pnpm install && pnpm dev` is the
whole setup.

```bash
pnpm build     # type-check + production build (dist/)
pnpm test      # vitest
pnpm lint      # biome
```

## Tech stack

React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Radix UI · Tailwind CSS v4 ·
Mock Service Worker · Vitest · Biome

## Architecture

```
src/
  app/router.tsx          — the app's one route; filter/sort/modal state is typed search params
  components/ui/          — presentational primitives (Select, Toast, ErrorPage, ...): props in,
                             markup out, no data fetching
  lib/
    api/client.ts          — thin fetch wrapper every API call goes through
    useToast.tsx            — app-wide toast state
  modules/releases/         — the one feature module: everything it needs to fetch, mutate, and
                               render its own data, grouped by sub-domain (tasks/, owners/,
                               filters/, task-details/, builds/, api/)
  mocks/
    data.ts                 — the fake in-memory "database" (events, owners) seeded on page load
    handlers.ts              — MSW request handlers implementing the same REST contract a real
                                backend would (pagination, PATCH tri-state semantics, a simulated
                                async build-completion webhook, ...)
    browser.ts                — wires the handlers into MSW's browser worker (started in main.tsx)
```

**Data flow:** a component calls a hook (`useTasks`, `useOwners`, `useTaskMutations`,
`useTriggerBuild`) → the hook wraps a `queryOptions`/`useMutation` from `modules/releases/api/*` →
that calls `apiFetch('/api/release/...')` → MSW intercepts the request and returns data from the
mock dataset. Nothing in the component or hook layer knows or cares that there's no real server on
the other end — swapping the mocks for a real backend would mean changing `src/mocks/` and
nothing else.

**Notable interaction details**, since a screenshot alone won't show these:

- Editing an owner, status, or ticket list updates the card/modal **immediately** (optimistic),
  then rolls back to the previous value only if the mock server rejects it — matching how the
  real backend's PATCH endpoint behaves.
- Triggering a build shows "running" immediately, then — after a few seconds, simulating a
  CI webhook — settles into success/failure on its own. Tab away and back (or leave the tab open)
  to see it resolve, the same way `refetchOnWindowFocus` picks up a real webhook-driven change.
- The date range, search, owner filter, sort column/direction, and open task modal are all in the
  URL — copy the address bar at any point and it reproduces exactly what you're looking at.

## What's mocked vs. real

| | |
|---|---|
| UI, state management, optimistic updates | Real — this is the actual frontend code |
| `/api/release/**` responses | Mocked (MSW), backed by `src/mocks/data.ts` |
| Authentication | Removed — the original app gated everything behind Okta/OIDC; this demo has no login |
| Build triggers / CircleCI, ticket links | Simulated — no real CI or ticketing system is called |

## License

MIT — see [LICENSE](LICENSE).
