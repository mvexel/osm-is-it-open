# Opening Hours Python Port - Future Contribution

## Goal
Port opening_hours.js to native Python and contribute to https://github.com/opening-hours/pyopening_hours

## Current Situation
- **pyopening_hours**: JS wrapper, last updated 2014, dormant, Python 2 only
- **opening_hours.js**: Full-featured, actively maintained
- **opening-hours-py**: Not maintained, doesn't support Python 3
- **Current implementation**: Basic regex-based parser for MVP (handles ~60-70% of common cases)

## Port Strategy

### Phase 1: Core Parser
- [ ] Tokenizer/lexer for opening_hours syntax
- [ ] AST (Abstract Syntax Tree) generation
- [ ] Basic time range parsing
- [ ] Weekday range support

### Phase 2: Advanced Features
- [ ] Month/year ranges
- [ ] Holiday support (public, school)
- [ ] Variable times (sunrise, sunset)
- [ ] Conditional states (unknown, maybe)
- [ ] Comments parsing

### Phase 3: API Implementation
- [ ] Simple API (`getState()`, `getNextChange()`)
- [ ] High-level API (`getOpenIntervals()`, `getOpenDuration()`)
- [ ] Iterator API for efficient traversal

### Phase 4: Testing & Validation
- [ ] Port test suite from opening_hours.js
- [ ] Validate against real OSM data
- [ ] Performance benchmarking
- [ ] Documentation

## Architecture Considerations

### Parser Design
```python
class OpeningHours:
    def __init__(self, oh_string: str, options: dict = None)
    def is_open(self, date: datetime = None) -> bool
    def get_next_change(self, date: datetime = None) -> datetime
    def get_open_intervals(self, start: datetime, end: datetime) -> List[Interval]
```

### Key Components
1. **Tokenizer**: Break OH string into tokens
2. **Parser**: Build rule tree from tokens
3. **Evaluator**: Check if rules match a given time
4. **Formatter**: Human-readable output

## Resources
- Reference: https://github.com/opening-hours/opening_hours.js
- Spec: https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification
- Test data: https://github.com/opening-hours/opening_hours_evaluation_tool

## For MVP (Current Project)
Using simplified regex-based parser in `backend/app/opening_hours.py`:

**Currently handles:**
- `24/7`
- Basic time ranges: `09:00-17:00`
- Day ranges: `Mo-Fr 09:00-17:00`
- Multiple days: `Mo,We,Fr 10:00-18:00`
- Overnight: `22:00-02:00`
- Multiple rules: `Mo-Fr 09:00-17:00; Sa 10:00-14:00`

**Returns "unknown" for:**
- Complex selectors (week of month, holidays)
- Variable times (sunrise, sunset)
- Conditional rules
- Month/year specifications

## Timeline
- Research & design: 1-2 weeks
- Core implementation: 3-4 weeks
- Testing & refinement: 2-3 weeks
- Documentation: 1 week

**Total estimate**: 2-3 months part-time

## Contribution Plan
1. Contact pyopening_hours maintainers
2. Propose native Python implementation
3. Develop in feature branch
4. Submit PRs incrementally (not one massive PR)
5. Add comprehensive tests with each feature
6. Maintain backward compatibility with existing wrapper
