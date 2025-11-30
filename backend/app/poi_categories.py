"""
POI category definitions based on
https://github.com/mvexel/osm-poi-classification/blob/main/mapping.csv
"""

# Common categories that typically have opening hours
POI_CATEGORIES = [
    # Food & Drink
    ("amenity", "restaurant"),
    ("amenity", "cafe"),
    ("amenity", "bar"),
    ("amenity", "pub"),
    ("amenity", "fast_food"),
    ("amenity", "food_court"),
    ("amenity", "ice_cream"),

    # Shops
    ("shop", "convenience"),
    ("shop", "supermarket"),
    ("shop", "bakery"),
    ("shop", "butcher"),
    ("shop", "coffee"),
    ("shop", "grocery"),
    ("shop", "greengrocer"),
    ("shop", "clothes"),
    ("shop", "shoes"),
    ("shop", "books"),
    ("shop", "gift"),
    ("shop", "florist"),
    ("shop", "hardware"),
    ("shop", "electronics"),
    ("shop", "mobile_phone"),
    ("shop", "furniture"),
    ("shop", "toys"),
    ("shop", "sports"),
    ("shop", "bicycle"),
    ("shop", "pharmacy"),
    ("shop", "chemist"),
    ("shop", "hairdresser"),
    ("shop", "beauty"),

    # Services
    ("amenity", "bank"),
    ("amenity", "pharmacy"),
    ("amenity", "post_office"),
    ("amenity", "library"),
    ("amenity", "fuel"),

    # Entertainment
    ("amenity", "cinema"),
    ("amenity", "theatre"),
    ("amenity", "nightclub"),

    # Healthcare
    ("amenity", "doctors"),
    ("amenity", "dentist"),
    ("amenity", "clinic"),
    ("amenity", "hospital"),
    ("amenity", "veterinary"),
]


def get_poi_query_filters() -> str:
    """
    Generate Overpass QL filter string for POI categories
    """
    filters = []
    for key, value in POI_CATEGORIES:
        filters.append(f'  node["{key}"="{value}"]({{bbox}});')

    return "\n".join(filters)
