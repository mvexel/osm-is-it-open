from datetime import datetime
from typing import Optional
import logging
from .models import OpenStatus

try:
    from opening_hours import OpeningHours, State
except Exception:  # pragma: no cover - defensive fallback if deps missing
    OpeningHours = None  # type: ignore
    State = None  # type: ignore

logger = logging.getLogger(__name__)


def determine_open_status(opening_hours_str: Optional[str]) -> OpenStatus:
    """
    Determine if a POI is currently open using opening-hours-rs Python bindings.
    Returns "unknown" if the library is unavailable or parsing fails.
    """
    if not opening_hours_str or not OpeningHours or not State:
        return "unknown"

    try:
        oh = OpeningHours(opening_hours_str.strip())
        state = oh.state(datetime.now())
    except Exception as exc:
        logger.debug("OpeningHours parse/eval failed for %s: %s", opening_hours_str, exc)
        return "unknown"

    if state == State.OPEN:
        return "open"
    if state == State.CLOSED:
        return "closed"
    return "unknown"
