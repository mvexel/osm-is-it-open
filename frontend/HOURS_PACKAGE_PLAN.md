# Hours Display Package Plan

Goal: build a small TS/React package (`@osm-is-it-open/hours`) that formats and displays OSM opening_hours strings, reusable in-app and publishable to npm.

## Phases & Checklist

### 1) Package scaffold
- [x] Create `frontend/packages/hours/` with `package.json` (name, version, module/exports for ESM+CJS, types, files).
- [x] Add `tsconfig` inheriting workspace config; ensure JSX + `dom` libs.
- [x] Add `tsup.config.ts` for dual builds (esm/cjs), sourcemaps, dts.
- [x] Add minimal README and LICENSE stub (MIT).

### 2) Core API
- [x] Implement `formatOpeningHours(ohString, opts)` that returns `{ status, label, nextChange?, intervals[] }` using `opening_hours` JS. Handle parser errors gracefully → status `unknown`.
- [x] Implement `normalizeOpeningHours(ohString)` via `oh.prettifyValue()`; fall back to original string on error.
- [x] Define shared types: `OpeningStatus = "open" | "closed" | "unknown"`, `DayInterval { day: number; ranges: { start: string; end: string }[] }`.
- [x] Add a 7-day lookahead and interval limit (e.g., max 50) to avoid pathological inputs.

### 3) React components
- [x] `OpeningHoursBadge`: shows status pill and next-change text (“Open • until 17:00” / “Closed • opens 09:00” / “Unknown”). Props: `ohString`, `coords?`, `className?`.
- [x] `OpeningHoursSchedule`: weekly list/table highlighting today; shows daily ranges; props: `ohString`, `coords?`, `startOfWeek?`, `className?`.
- [x] Styling: minimal CSS-in-TS classes; expose `className`/`style` passthroughs for host styling (Tailwind-friendly).

### 4) Testing & examples
- [x] Add `vitest` setup for the package; tests for 24/7, Mo-Fr 09:00-17:00, overnight ranges, invalid strings → unknown, PH off → unknown.
- [ ] Add a small Storybook-like examples page or MDX snippet under `examples/` using Vite/React for manual QA.
- [x] Add a demo page that accepts an OSM ID, fetches its opening_hours, and renders `OpeningHoursBadge` + `OpeningHoursSchedule` for manual validation.
- [ ] Ensure build outputs `.d.ts` and type tests pass (`tsc --noEmit`).

### 5) Integration into app
- [ ] Replace current status text with `OpeningHoursBadge` in the map popup/POI card (once cards exist).
- [ ] Optionally add a collapsible `OpeningHoursSchedule` in detail view.
- [ ] Wire coords into helpers when available to improve sunrise/sunset accuracy.

### 6) Publish readiness
- [ ] Verify package `files`/`exports` fields and license.
- [ ] Add publish script (`npm publish --access public`) and note versioning policy.
- [ ] Document usage in repo README/AGENTS (import examples).

## Follow-ups
- [ ] Add timezone-aware formatting via `date-fns-tz` (respect POI coords/timezone).
- [ ] Consider `date-holidays` once holiday-aware UX is defined.
- [ ] Integrate `OpeningHoursBadge`/`OpeningHoursSchedule` into the main app POI UI.

Future: add `OpeningHoursEditor` component with `onEdit`/`onSave` hooks for OSM-backed editing.
