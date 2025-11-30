# @osm-is-it-open/hours (scaffold)

Work-in-progress package for formatting and rendering OSM `opening_hours` strings in React, built on the canonical [`opening_hours`](https://www.npmjs.com/package/opening_hours) parser.

## Scripts

- `npm run build` — builds ESM + CJS outputs with type declarations.
- `npm run clean` — removes `dist/`.

## API (current)

- `formatOpeningHours(ohString, opts?)` → `{ status, label, nextChange?, intervals[], normalized?, warnings? }`.
- `normalizeOpeningHours(ohString)` → prettified string (falls back to input on error).
- `OpeningHoursBadge` — status chip with “Open until …” text.
- `OpeningHoursSchedule` — weekly view (7 days, today highlighted).

## Notes

- Depends on `opening_hours` (JS), React, and React DOM. Components will be added next.
