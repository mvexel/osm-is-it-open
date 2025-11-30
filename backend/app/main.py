from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import List
from .models import POI, POIResponse
from .overpass import query_overpass
from .opening_hours import determine_open_status

app = FastAPI(title="OSM Is It Open API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "OSM Is It Open API"}


@app.get("/api/pois", response_model=POIResponse)
async def get_pois(
    bbox: str = Query(..., description="Bounding box as 'west,south,east,north'")
):
    """
    Get POIs within a bounding box with their current open/closed status
    """
    try:
        # Parse bbox
        coords = [float(x) for x in bbox.split(',')]
        if len(coords) != 4:
            raise ValueError("Bbox must contain exactly 4 coordinates")

        west, south, east, north = coords

        # Query Overpass
        pois = await query_overpass(south, west, north, east)

        # Determine open status for each POI
        for poi in pois:
            poi.openStatus = determine_open_status(poi.openingHours)

        return POIResponse(pois=pois)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching POIs: {str(e)}")


@app.get("/api/health")
async def health():
    return {"status": "healthy"}
