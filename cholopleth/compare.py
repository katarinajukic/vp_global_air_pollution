import geopandas as gpd
from fuzzywuzzy import process

# Load the GeoJSON file
world = gpd.read_file("world.geojson")

# Extract country names
geo_country_names = world["name"].tolist()

# Your dataset
your_data = [...]  # Your dataset containing country names

# Match countries in your dataset with GeoJSON country names
for country in your_data:
    match, confidence = process.extractOne(country, geo_country_names)
    if confidence > 80:  # Adjust the threshold based on your dataset
        # Assign GeoJSON features to your dataset entry
        country_geometry = world[world["name"] == match]["geometry"].iloc[0]
        # Plot the data on a map or perform further analysis
