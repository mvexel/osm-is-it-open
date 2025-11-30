import httpx
from typing import List
from .models import POI
from .poi_categories import get_poi_query_filters
import logging
import time

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
CACHE_TTL_SECONDS = 120
CACHE_MAX_ENTRIES = 128
_cache: dict[tuple[float, float, float, float], tuple[float, list[POI]]] = {}


def _quantize(value: float, precision: int = 4) -> float:
    """Round coordinates to reduce cache key churn."""
    return round(value, precision)


def _cache_key(south: float, west: float, north: float, east: float) -> tuple[float, float, float, float]:
    return (
        _quantize(south),
        _quantize(west),
        _quantize(north),
        _quantize(east),
    )


def _get_from_cache(key: tuple[float, float, float, float]) -> list[POI] | None:
    now = time.time()
    entry = _cache.get(key)
    if not entry:
        return None
    ts, pois = entry
    if now - ts > CACHE_TTL_SECONDS:
        _cache.pop(key, None)
        return None
    logger.debug("Cache hit for bbox=%s", key)
    return pois


def _store_in_cache(key: tuple[float, float, float, float], pois: list[POI]) -> None:
    _cache[key] = (time.time(), pois)
    if len(_cache) > CACHE_MAX_ENTRIES:
        # Drop oldest entry
        oldest_key = min(_cache.items(), key=lambda item: item[1][0])[0]
        _cache.pop(oldest_key, None)


async def query_overpass(south: float, west: float, north: float, east: float) -> List[POI]:
    """
    Query Overpass API for POIs in the given bounding box
    """
    key = _cache_key(south, west, north, east)
    cached = _get_from_cache(key)
    if cached is not None:
        return cached

    # Build query based on POI categories
    filters = get_poi_query_filters()

    # Create Overpass QL query
    query = f"""
    [out:json][timeout:25];
    (
      {filters}
    );
    out body;
    >;
    out skel qt;
    """

    # Execute query
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                OVERPASS_URL,
                data={"data": query.replace("{bbox}", f"{south},{west},{north},{east}")},
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            logger.exception("Overpass request failed for bbox=%s: %s", key, exc)
            raise

    # Parse results
    pois = []
    for element in data.get("elements", []):
        if element["type"] != "node":
            continue

        tags = element.get("tags", {})

        # Extract opening hours
        opening_hours = (
            tags.get("opening_hours") or
            tags.get("opening_hours:covid19") or
            None
        )

        poi = POI(
            id=f"node/{element['id']}",
            lat=element["lat"],
            lon=element["lon"],
            name=tags.get("name"),
            amenity=tags.get("amenity"),
            shop=tags.get("shop"),
            tags=tags,
            openingHours=opening_hours,
        )
        pois.append(poi)

    _store_in_cache(key, pois)
    return pois
