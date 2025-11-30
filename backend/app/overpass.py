import httpx
from typing import List
from .models import POI
from .poi_categories import get_poi_query_filters

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


async def query_overpass(south: float, west: float, north: float, east: float) -> List[POI]:
    """
    Query Overpass API for POIs in the given bounding box
    """
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
        response = await client.post(
            OVERPASS_URL,
            data={"data": query.replace("{bbox}", f"{south},{west},{north},{east}")},
        )
        response.raise_for_status()
        data = response.json()

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

    return pois
