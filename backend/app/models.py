from pydantic import BaseModel
from typing import Optional, Dict, Literal

OpenStatus = Literal["open", "closed", "unknown"]


class POI(BaseModel):
    id: str
    lat: float
    lon: float
    name: Optional[str] = None
    amenity: Optional[str] = None
    shop: Optional[str] = None
    tags: Dict[str, str]
    openingHours: Optional[str] = None
    openStatus: OpenStatus = "unknown"


class POIResponse(BaseModel):
    pois: list[POI]
