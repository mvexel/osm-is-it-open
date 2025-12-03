# @osm-is-it-open/hours

**Pure React UI components for displaying and editing OpenStreetMap opening hours**

This experimental library provides **UI components only** — no parsing, validation, or formatting utilities. All opening hours logic is handled by the excellent [`opening_hours`](https://www.npmjs.com/package/opening_hours) npm package, which we depend on and re-export for convenience.

**Key principles:**
- Components accept `opening_hours` instances, not strings
- No utility functions exposed — use the `opening_hours` library directly
- Components return modified `opening_hours` instances via callbacks
- Transparent API that doesn't hide the underlying library

It's not on npm yet so you'll have to include it as a local dependency for now

## Display schedule

```tsx
import { opening_hours, OpeningHoursSchedule } from '@osm-is-it-open/hours'

const oh = new opening_hours('Mo-Fr 09:00-17:00; Sa 10:00-14:00')

<OpeningHoursSchedule
  openingHours={oh}
  locale="en"
  dayLabelStyle="short"
  timeZone="America/New_York"
/>
```

Schedule props:
- `locale` (default: `'en'`)
- `dayLabelStyle`: `'short' | 'long'` (default: `'short'`)
- `timeZone` (optional)
- `hourCycle`: `'12h' | '24h'` (default: inferred from locale)
- `startOfWeek`: `0 | 1` (default: `1`)
- `className` for custom styling hooks

### Editor 

Let users edit opening hours inline:

```tsx
import { opening_hours, OpeningHoursEditor } from '@osm-is-it-open/hours'

const [value, setValue] = useState(() => new opening_hours('Mo-Fr 09:00-17:00'))

<OpeningHoursEditor
  openingHours={value}
  onChange={(next) => setValue(next)}
  locale="en"
  dayLabelStyle="short"
/>
```

Editor props:
- `openingHours` (required) — `opening_hours` instance to edit
- `onChange` — called with a new `opening_hours` instance when edits are valid
- `locale`, `dayLabelStyle`, `className`

### Location context

The `opening_hours` library supports location-specific parsing (for public holidays, etc.):

```tsx
import { opening_hours } from '@osm-is-it-open/hours'

const locationContext = {
  lat: 51.5074,
  lon: -0.1278,
  address: {
    country_code: 'gb',
    state: ''
  }
}

const oh = new opening_hours('Mo-Fr 09:00-17:00; PH off', locationContext)

<OpeningHoursSchedule openingHours={oh} />
```

Public holiday rules (`PH`) require a country code. The location object provides geographic context for the `opening_hours` library—it's not making any API calls, just providing metadata for parsing.

Components support optional i18next integration. If `react-i18next` is available, components will use your configured translations. Otherwise, English text is used as a fallback.

**Contributing a locale:** Add your strings to `src/locales/index.ts` (or open a PR with the new locale bundle). Include translations for `open_now`, `open_until`, `closed`, `closed_opens`, and `unknown`. i18next will be used when present; the fallback map is only for when i18next is not configured.

## More to read
Basic TSDoc is [available](https://mvexel.github.io/osm-is-it-open/api/)