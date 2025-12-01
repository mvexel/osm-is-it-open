# Contributing to @osm-is-it-open/hours

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Philosophy

Before contributing, please understand the core philosophy of this library:

**This is a pure UI component library.** We intentionally do not expose utility functions for parsing, validating, or formatting opening hours. All such logic is handled by the [`opening_hours`](https://www.npmjs.com/package/opening_hours) npm package.

**Key principles:**
- Components accept `opening_hours` instances, not strings
- No utility functions in the public API
- Components return modified `opening_hours` instances via callbacks
- Transparent API that doesn't hide the underlying library

If you want to add parsing/validation utilities, please contribute to the `opening_hours` library instead.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mvexel/osm-is-it-open.git
   cd osm-is-it-open
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Build the package:**
   ```bash
   npm run build
   ```

5. **Run type checking:**
   ```bash
   npm run typecheck
   ```

## Project Structure

```
src/
├── index.ts                      # Public exports
├── model.ts                      # Internal editor model (not exported)
├── styles.css                    # Component styles
└── components/
    ├── types.ts                  # Component prop types (exported)
    ├── OpeningHours.tsx          # Display component
    ├── OpeningHoursEditor.tsx    # Editor component
    ├── DayRow.tsx                # Internal: Editor day row
    ├── RangeChip.tsx             # Internal: Time range chip
    ├── openingHoursTypes.ts      # Internal: Editor model types
    └── icons/                    # Internal: Icon components
```

## Pull Request Guidelines

1. **Create an issue first** for significant changes to discuss the approach
2. **Write tests** for new functionality
3. **Update documentation** (README.md, types, JSDoc comments)
4. **Follow TypeScript best practices** - use strict types, avoid `any`
5. **Keep it focused** - one feature or fix per PR
6. **Update CHANGELOG.md** with your changes
7. **Test locally** - ensure build and tests pass

## Component API Guidelines

When adding or modifying components:

1. **Accept `opening_hours` instances:**
   ```tsx
   // ✅ Good
   <Component openingHours={ohInstance} />

   // ❌ Bad - don't accept strings
   <Component openingHours="Mo-Fr 09:00-17:00" />
   ```

2. **Return `opening_hours` instances in callbacks:**
   ```tsx
   // ✅ Good
   onChange={(newOh: OpeningHoursLib) => {}}

   // ❌ Bad - don't return strings
   onChange={(newValue: string) => {}}
   ```

3. **Don't expose internal utilities:**
   - Keep parsing/formatting logic internal
   - Don't export helper functions like `parseOpeningHours` or `formatOpeningHours`
   - Users should use the `opening_hours` library directly

4. **Document props thoroughly:**
   - Add JSDoc comments to props interfaces
   - Include examples in component documentation
   - Specify default values

## Coding Standards

- **TypeScript:** Use strict types, avoid `any`
- **React:** Functional components with hooks
- **Styling:** CSS-in-file with semantic class names
- **Naming:** PascalCase for components, camelCase for functions
- **Formatting:** Use ESLint and Prettier (run `npm run lint`)

## Testing

- Write unit tests for new components
- Test edge cases and error conditions
- Ensure tests pass before submitting PR: `npm test`
- Test TypeScript types: `npm run typecheck`

## i18next Integration

When adding translatable strings:

1. Use the fallback pattern:
   ```tsx
   let t: (key: string, defaults?: string) => string
   try {
     const { useTranslation } = require('react-i18next')
     const { t: translate } = useTranslation()
     t = (key: string, defaults?: string) => translate(key, defaults)
   } catch {
     t = (_key: string, defaults?: string) => defaults ?? ''
   }
   ```

2. Add translation keys to README.md
3. Always provide English defaults

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Run `npm run build` to build dist/
4. Commit changes: `git commit -am "Release v0.x.x"`
5. Create tag: `git tag v0.x.x`
6. Push: `git push && git push --tags`
7. Publish: `npm publish`

## Questions?

Feel free to open an issue for:
- Questions about the architecture
- Discussion of new features
- Clarification on contribution guidelines

Thank you for contributing! 🎉
