# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-01

### Added
- Initial release of `@osm-is-it-open/hours` component library
- `OpeningHours` component for displaying opening status
- `OpeningHoursEditor` component for editing opening hours
- `OpeningHoursSchedule` component for displaying weekly schedule
- Pure UI component architecture (no utility functions)
- Components accept `opening_hours` instances directly
- Re-export of `opening_hours` library for convenience
- Optional i18next integration with English fallback
- Full TypeScript support with exported types
- Support for 12h/24h time formats
- Support for timezone and locale customization
- Editable mode for `OpeningHours` component

### Philosophy
- UI components only - no parsing/validation logic
- Transparent API that uses `opening_hours` library directly
- Components return modified `opening_hours` instances via callbacks

[0.1.0]: https://github.com/mvexel/osm-is-it-open/releases/tag/v0.1.0
