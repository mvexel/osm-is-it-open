"""
Quick test script for opening hours parser
Run with: python backend/test_opening_hours.py (after installing dependencies)
Or run tests via pytest after setup
"""
from datetime import datetime, time
import re


# Inline version for testing without dependencies
OpenStatus = str  # Literal["open", "closed", "unknown"]


def _evaluate_rule(rule: str, current_day: int, current_time: time) -> OpenStatus:
    """Evaluate a single opening hours rule"""
    day_map = {
        'Mo': 0, 'Tu': 1, 'We': 2, 'Th': 3, 'Fr': 4, 'Sa': 5, 'Su': 6
    }

    pattern = r'^(?:([A-Z][a-z](?:-[A-Z][a-z])?(?:,[A-Z][a-z](?:-[A-Z][a-z])?)*)\s+)?(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$'
    match = re.match(pattern, rule)

    if not match:
        return "unknown"

    day_spec, start_time_str, end_time_str = match.groups()

    try:
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
    except ValueError:
        return "unknown"

    if day_spec:
        day_matches = False
        for day_part in day_spec.split(','):
            if '-' in day_part:
                start_day, end_day = day_part.split('-')
                start_idx = day_map.get(start_day)
                end_idx = day_map.get(end_day)
                if start_idx is not None and end_idx is not None:
                    if start_idx <= current_day <= end_idx:
                        day_matches = True
                        break
            else:
                day_idx = day_map.get(day_part)
                if day_idx == current_day:
                    day_matches = True
                    break

        if not day_matches:
            return "unknown"

    if start_time <= end_time:
        if start_time <= current_time <= end_time:
            return "open"
        else:
            return "closed"
    else:
        if current_time >= start_time or current_time <= end_time:
            return "open"
        else:
            return "closed"

    return "unknown"


def determine_open_status(opening_hours_str: str | None) -> OpenStatus:
    """Determine if open based on opening hours"""
    if not opening_hours_str:
        return "unknown"

    oh = opening_hours_str.strip()
    if oh == "24/7":
        return "open"

    now = datetime.now()
    current_time = now.time()
    current_day = now.weekday()

    rules = [r.strip() for r in oh.split(';')]
    for rule in rules:
        status = _evaluate_rule(rule, current_day, current_time)
        if status != "unknown":
            return status

    return "unknown"


def test_basic_cases():
    """Test basic opening hours patterns"""

    print("Testing basic opening hours parser...\n")

    # Test 24/7
    assert determine_open_status("24/7") == "open"
    print("✓ 24/7 works")

    # Test None/empty
    assert determine_open_status(None) == "unknown"
    assert determine_open_status("") == "unknown"
    print("✓ None/empty returns unknown")

    # Test complex pattern that should return unknown
    assert determine_open_status("Mo-Fr 09:00-17:00; PH off") == "unknown"  # Has PH
    print("✓ Complex patterns return unknown")

    # Test rule evaluation at specific times
    monday_10am = 0  # Monday
    time_10am = time(10, 0)

    # Should be open Mo-Fr 09:00-17:00 on Monday at 10am
    result = _evaluate_rule("Mo-Fr 09:00-17:00", monday_10am, time_10am)
    assert result == "open"
    print("✓ Mo-Fr 09:00-17:00 open on Monday at 10am")

    # Should be closed at 8am
    time_8am = time(8, 0)
    result = _evaluate_rule("Mo-Fr 09:00-17:00", monday_10am, time_8am)
    assert result == "closed"
    print("✓ Mo-Fr 09:00-17:00 closed on Monday at 8am")

    # Test weekend
    saturday = 5  # Saturday
    result = _evaluate_rule("Mo-Fr 09:00-17:00", saturday, time_10am)
    assert result == "unknown"  # Not in day range
    print("✓ Mo-Fr 09:00-17:00 unknown on Saturday")

    # Test multiple days
    result = _evaluate_rule("Mo,We,Fr 10:00-18:00", monday_10am, time_10am)
    assert result == "open"
    print("✓ Mo,We,Fr 10:00-18:00 open on Monday at 10am")

    # Test overnight hours
    time_11pm = time(23, 0)
    result = _evaluate_rule("22:00-02:00", monday_10am, time_11pm)
    assert result == "open"
    print("✓ Overnight hours 22:00-02:00 open at 11pm")

    time_1am = time(1, 0)
    result = _evaluate_rule("22:00-02:00", monday_10am, time_1am)
    assert result == "open"
    print("✓ Overnight hours 22:00-02:00 open at 1am")

    print("\n✅ All basic tests passed!")


def test_real_world_examples():
    """Test with real-world opening hours from OSM"""

    print("\nTesting real-world examples...\n")

    examples = [
        ("24/7", "Always open convenience store"),
        ("Mo-Fr 09:00-17:00", "Office hours"),
        ("Mo-Fr 08:00-20:00; Sa 09:00-18:00", "Shop with different weekend hours"),
        ("Mo,We,Fr 10:00-18:00", "Part-time shop"),
        ("sunrise-sunset", "Should return unknown (not supported yet)"),
        ("Mo-Fr 09:00-17:00; PH off", "Should return unknown (holidays not supported)"),
    ]

    now = datetime.now()
    for oh, description in examples:
        status = determine_open_status(oh)
        print(f"  {description}")
        print(f"    Input: {oh}")
        print(f"    Status: {status}")
        print()


if __name__ == "__main__":
    test_basic_cases()
    test_real_world_examples()

    print("\nCurrent time check:")
    print(f"  Now: {datetime.now().strftime('%A %H:%M')}")
    print(f"  Mo-Fr 09:00-17:00: {determine_open_status('Mo-Fr 09:00-17:00')}")
    print(f"  24/7: {determine_open_status('24/7')}")
