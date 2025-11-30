# Main App Hours Integration Plan

Goal: use the `@osm-is-it-open/hours` package inside the app to show opening hours clearly and pave the way for timezone/holiday support.

## Steps
- [x] Add the package to the app (local path import) and expose `OpeningHoursBadge` where POIs are selected (off-map card).
- [x] Identify POI UI surface: detail card triggered by marker click; shows badge + schedule.
- [x] Pass coordinates into the formatter/components for accurate sunrise/sunset handling.
- [x] Add a user-facing clock preference toggle (12h/24h) or detect from locale; thread through to components.
- [ ] Keep Overpass calls unchanged; only augment display. Avoid extra network requests.
- [ ] Add minimal UI states: “Hours unavailable” when missing/invalid; “Zoom in” already present for bbox guard.

## Optional enhancements
- [ ] Add timezone formatting via `date-fns-tz` (use POI coords to infer tz).
- [ ] Consider `date-holidays` once we have a holiday-aware UX (e.g., surface PH closures).
- [ ] Add a small POI detail pane with `OpeningHoursSchedule` for richer view.
