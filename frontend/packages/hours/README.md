# @osm-is-it-open/hours (scaffold)

Work-in-progress package for formatting and rendering OSM `opening_hours` strings in React, built on the canonical [`opening_hours`](https://www.npmjs.com/package/opening_hours) parser.

## Scripts

- `npm run build` — builds ESM + CJS outputs with type declarations.
- `npm run clean` — removes `dist/`.
- `npm run demo` — launches a Vite demo at http://localhost:5173 for manual testing.
- `npm run test` — runs the Vitest suite.

## API (current)

- `formatOpeningHours(ohString, opts?)` → `{ status, label, nextChange?, intervals[], normalized?, warnings?, timeFormat }`.
  - Options include `locale`, `timeZone`, `coords`, `startOfWeek`, and `hourCycle` (`'12h' | '24h'`; falls back to 24h unless set).
- `normalizeOpeningHours(ohString)` → prettified string (falls back to input on error).
- `OpeningHoursBadge` — status chip with “Open until …” text.
- `OpeningHoursSchedule` — weekly view (7 days, today highlighted).
- `OpeningHoursEditor` — interactive builder to add days, multiple time ranges, and duplicate schedules.
- `parseOpeningHoursModel` / `buildOpeningHoursString` — convert between OSM `opening_hours` strings and a day/range model.

Demo page lets you enter an OSM element ID (node/way/relation), fetch its `opening_hours` via Overpass, and preview the badge + schedule components.

## Notes

- Depends on `opening_hours` (JS), React, and React DOM. Components will be added next.
