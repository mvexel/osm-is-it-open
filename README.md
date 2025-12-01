# @osm-is-it-open/hours

**Pure React UI components for displaying and editing OpenStreetMap opening hours**

[![npm version](https://img.shields.io/npm/v/@osm-is-it-open/hours.svg)](https://www.npmjs.com/package/@osm-is-it-open/hours)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Philosophy

This library provides **UI components only** — no parsing, validation, or formatting utilities. All opening hours logic is handled by the excellent [`opening_hours`](https://www.npmjs.com/package/opening_hours) npm package, which we depend on and re-export for convenience.

**Key principles:**
- Components accept `opening_hours` instances, not strings
- No utility functions exposed — use the `opening_hours` library directly
- Components return modified `opening_hours` instances via callbacks
- Transparent API that doesn't hide the underlying library

## Installation

```bash
npm install @osm-is-it-open/hours
```

Optional (for translations):
```bash
npm install i18next react-i18next
```

## Usage

### Display Component

```tsx
import { opening_hours, OpeningHours } from '@osm-is-it-open/hours'
import '@osm-is-it-open/hours/dist/styles.css'

// Create opening_hours instance
const oh = new opening_hours('Mo-Fr 09:00-17:00')

// Display status badge
<OpeningHours
  openingHours={oh}
  hourCycle="12h"
/>
```

### Editor Component

```tsx
import { opening_hours, OpeningHoursEditor } from '@osm-is-it-open/hours'

const [oh, setOh] = useState(() => new opening_hours('Mo-Fr 09:00-17:00'))

<OpeningHoursEditor
  openingHours={oh}
  onChange={(newOh) => setOh(newOh)}
  hourCycle="12h"
/>
```

### Editable Display Component

The main `OpeningHours` component supports inline editing:

```tsx
<OpeningHours
  openingHours={oh}
  editable={true}
  onChange={(newOh) => setOh(newOh)}
/>
```

### Schedule Component

Render a week-at-a-glance schedule without any editing UI:

```tsx
import { OpeningHoursSchedule } from '@osm-is-it-open/hours'

<OpeningHoursSchedule
  openingHours={oh}
  locale="en"
  timeZone="America/New_York"
  hourCycle="12h"
  dayLabelStyle="long"
  startOfWeek={1} // Monday
/>
```

Schedule props:
- `locale` (default: `'en'`)
- `dayLabelStyle`: `'short' | 'long'` (default: `'short'`)
- `timeZone` (optional)
- `hourCycle`: `'12h' | '24h'` (default: `'24h'`)
- `startOfWeek`: `0 | 1` (default: `1`)
- `className` for custom styling hooks

### Working with Location Context

The `opening_hours` library supports location-specific parsing (for public holidays, etc.):

```tsx
import { opening_hours } from '@osm-is-it-open/hours'

const nominatim = {
  lat: 51.5074,
  lon: -0.1278,
  address: {
    country_code: 'gb',
    state: ''
  }
}

const oh = new opening_hours('Mo-Fr 09:00-17:00; PH off', nominatim)

<OpeningHours openingHours={oh} />
```

Public holiday rules (`PH`) require a country code. Today you pass that context yourself (see `address.country_code` above).
Longer term we plan to surface a helper using [`date-holidays`](https://www.npmjs.com/package/date-holidays) so you can derive
holiday context from locale/coordinates automatically while keeping the UI layer slim.

## Components

### `<OpeningHours>`

Displays current opening status as a badge with "Open/Closed" state and next change time.

**Props:**
- `openingHours: OpeningHoursLib` - opening_hours instance to display (required)
- `locale?: string` - Locale for formatting (default: 'en')
- `timeZone?: string` - Timezone for display (default: user's local timezone)
- `hourCycle?: '12h' | '24h'` - Hour cycle (default: '24h')
- `now?: Date` - Reference time for status calculation (default: current time)
- `className?: string` - Additional CSS class
- `editable?: boolean` - Enable editing mode (default: false)
- `onChange?: (openingHours: OpeningHoursLib) => void` - Callback for changes (when editable=true)

### `<OpeningHoursEditor>`

Full-featured editor for opening hours with visual day/time range editing.

**Props:**
- `openingHours: OpeningHoursLib` - opening_hours instance to edit (required)
- `onChange?: (openingHours: OpeningHoursLib) => void` - Callback when modified
- `hourCycle?: '12h' | '24h'` - Hour cycle (default: '24h')
- `className?: string` - Additional CSS class
- `originalOpeningHours?: OpeningHoursLib` - Original instance for comparison/reset

## Internationalization

Components support optional i18next integration. If `react-i18next` is available, components will use your configured translations. Otherwise, English text is used as a fallback.

**Translation keys:**
- `opening_hours.open_now` - "Open now"
- `opening_hours.open_until` - "Open until {time}"
- `opening_hours.closed` - "Closed"
- `opening_hours.closed_opens` - "Closed • opens {time}"
- `opening_hours.unknown` - "Hours unavailable"

**Fallback locales:** Basic strings ship for `en`, `fr`, `de`, `es`, `it`, `nl`, `pt`, `sv`, `ja`, and `zh-CN`. Prefer i18next for full coverage.

**Contributing a locale:** Add your strings to `src/locales/index.ts` (or open a PR with the new locale bundle). Include translations for `open_now`, `open_until`, `closed`, `closed_opens`, and `unknown`. i18next will be used when present; the fallback map is only for when i18next is not configured.

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  OpeningHoursProps,
  OpeningHoursEditorProps,
  OpeningHoursScheduleProps,
  OpeningHoursLib,
  nominatim_object
} from '@osm-is-it-open/hours'
```

## API Philosophy

This library intentionally provides **no parsing or formatting utilities**. Users should interact directly with the `opening_hours` library:

```tsx
import { opening_hours } from '@osm-is-it-open/hours'

// Parse opening hours string
const oh = new opening_hours('Mo-Fr 09:00-17:00')

// Check if currently open
const isOpen = oh.getState(new Date())

// Get next status change
const nextChange = oh.getNextChange(new Date())

// Get open intervals for date range
const intervals = oh.getOpenIntervals(startDate, endDate)

// Get prettified string
const prettified = oh.prettifyValue()
```

See the [opening_hours documentation](https://github.com/opening-hours/opening_hours.js) for full API details.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 18+
- No IE11 support

## License

MIT © Martijn van Exel

## Related Projects

- [opening_hours.js](https://github.com/opening-hours/opening_hours.js/) - The underlying parsing library
- [osm-is-it-open](https://github.com/mvexel/osm-is-it-open) - Demo application

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
