from datetime import datetime, time
from typing import Optional
import re
from .models import OpenStatus


def determine_open_status(opening_hours_str: Optional[str]) -> OpenStatus:
    """
    Determine if a POI is currently open based on opening_hours tag

    This is a TEMPORARY simplified implementation that handles basic cases.

    TODO: Replace with proper opening_hours parser once we complete the
    native Python port and contribute to pyopening_hours project.
    See FUTURE_OPENING_HOURS_PORT.md for the full implementation plan.

    Current support:
    - 24/7
    - Basic time ranges (e.g., "09:00-17:00")
    - Day ranges (e.g., "Mo-Fr 09:00-17:00")
    - Multiple rules separated by semicolons

    Not supported yet (returns unknown):
    - Complex selectors (week of month, holidays, etc.)
    - Variable times (sunrise, sunset)
    - Conditional rules
    """
    if not opening_hours_str:
        return "unknown"

    oh = opening_hours_str.strip()

    # Handle 24/7
    if oh == "24/7":
        return "open"

    now = datetime.now()
    current_time = now.time()
    current_day = now.weekday()  # 0 = Monday, 6 = Sunday

    # Split by semicolon for multiple rules
    rules = [r.strip() for r in oh.split(';')]

    for rule in rules:
        status = _evaluate_rule(rule, current_day, current_time)
        if status != "unknown":
            return status

    return "unknown"


def _evaluate_rule(rule: str, current_day: int, current_time: time) -> OpenStatus:
    """Evaluate a single opening hours rule"""

    # Pattern: "Mo-Fr 09:00-17:00" or just "09:00-17:00"
    # Day abbreviations: Mo, Tu, We, Th, Fr, Sa, Su
    day_map = {
        'Mo': 0, 'Tu': 1, 'We': 2, 'Th': 3, 'Fr': 4, 'Sa': 5, 'Su': 6
    }

    # Try to parse day range and time range
    # Pattern: optional day range, then time range
    pattern = r'^(?:([A-Z][a-z](?:-[A-Z][a-z])?(?:,[A-Z][a-z](?:-[A-Z][a-z])?)*)\s+)?(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$'
    match = re.match(pattern, rule)

    if not match:
        return "unknown"

    day_spec, start_time_str, end_time_str = match.groups()

    # Parse times
    try:
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
    except ValueError:
        return "unknown"

    # Check if current day matches
    if day_spec:
        day_matches = False
        for day_part in day_spec.split(','):
            if '-' in day_part:
                # Range like "Mo-Fr"
                start_day, end_day = day_part.split('-')
                start_idx = day_map.get(start_day)
                end_idx = day_map.get(end_day)
                if start_idx is not None and end_idx is not None:
                    if start_idx <= current_day <= end_idx:
                        day_matches = True
                        break
            else:
                # Single day like "Mo"
                day_idx = day_map.get(day_part)
                if day_idx == current_day:
                    day_matches = True
                    break

        if not day_matches:
            return "unknown"

    # Check if current time is within range
    # Handle overnight ranges (e.g., 22:00-02:00)
    if start_time <= end_time:
        # Normal range (same day)
        if start_time <= current_time <= end_time:
            return "open"
        else:
            return "closed"
    else:
        # Overnight range
        if current_time >= start_time or current_time <= end_time:
            return "open"
        else:
            return "closed"

    return "unknown"
