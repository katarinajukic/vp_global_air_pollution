// Set up the SVG canvas
const width = 900; // Updated width
const height = 700; // Updated height

const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(d3.zoom()
    .scaleExtent([1, 8]) // Adjust zoom level as needed
    .translateExtent([[0, 0], [width, height]]) // Set translate extent to constrain panning
    .on("zoom", function (event) {
      svg.attr("transform", event.transform);
    }))
  .append("g");

// Define a projection
const projection = d3.geoMercator()
  .scale(150) // Adjusted scale for better visualization
  .translate([width / 2, height / 1.5]);

// Define a path generator
const path = d3.geoPath().projection(projection);

// Load the world map data
Promise.all([
  d3.json("../csv/countries.geo.json"),
  d3.csv("../csv/world_air_pollution_data.csv")
]).then(function([world, data]) {
  console.log('World GeoJSON Loaded:', world);
  console.log('Air Pollution Data Loaded:', data);

  const countries = world.features;

  // Log the country names from GeoJSON data
  console.log('Country Names from GeoJSON:', countries.map(d => d.properties.name));

  // Log the unique country names from CSV data
  console.log('Unique Country Names from CSV:', [...new Set(data.map(d => d.Country))]);

  // Create a map to easily lookup data by country
  const countryDataMap = {};
  data.forEach(d => {
    if (!countryDataMap[d.Country]) {
      countryDataMap[d.Country] = [];
    }
    countryDataMap[d.Country].push(d);
  });

  // Draw the map
  svg.selectAll("path")
    .data(countries)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", function(d) {
      const countryName = d.properties.name;
      const countryData = countryDataMap[countryName];
      if (countryData) {
        // Return color based on the first data value for simplicity
        return getColor(countryData[0]["AQI Category"]);
      } else {
        // Log and handle missing data
        console.log(`No data for country: ${countryName}`);
        return "lightblue";
      }
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .attr("class", "country")
    .on("mouseover", function(event, d) {
      const countryName = d.properties.name;
      const countryData = countryDataMap[countryName];
      if (countryData) {
        const [x, y] = d3.pointer(event);
        d3.select("#tooltip")
          .style("left", `${x}px`)
          .style("top", `${y}px`)
          .html(`<strong>${countryName}</strong><br>AQI: ${countryData[0]["AQI Value"]}<br>Category: ${countryData[0]["AQI Category"]}`)
          .classed("hidden", false);
      }
    })
    .on("mouseout", function() {
      d3.select("#tooltip").classed("hidden", true);
    });

  // Draw the circles for cities
  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", function(d) {
        return projection([d.lng, d.lat])[0]; // Use d.lng for longitude and d.lat for latitude
    })
    .attr("cy", function(d) {
        return projection([d.lng, d.lat])[1];
    })
    .attr("r", 0.5) // Set the radius of the circles to a smaller value
    .attr("fill", "black") // Set the fill color of the circles
    .attr("opacity", 0.8) // Set the opacity of the circles
    .on("mouseover", function(event, d) {
        // Display additional information about the city on hover
        const [x, y] = d3.pointer(event);
        d3.select("#tooltip")
            .style("left", `${x + 10}px`) // Adjust the left position
            .style("top", `${y + 10}px`) // Adjust the top position
            .html(`<strong>${d.City}</strong><br>
                AQI: ${d["AQI Value"]} (${d["AQI Category"]})<br>
                CO AQI: ${d["CO AQI Value"]} (${d["CO AQI Category"]})<br>
                Ozone AQI: ${d["Ozone AQI Value"]} (${d["Ozone AQI Category"]})<br>
                NO2 AQI: ${d["NO2 AQI Value"]} (${d["NO2 AQI Category"]})<br>
                PM2.5 AQI: ${d["PM2.5 AQI Value"]} (${d["PM2.5 AQI Category"]})`)
            .classed("hidden", false);
    })
    .on("mouseout", function() {
        // Hide the tooltip when mouse moves out of the circle
        d3.select("#tooltip").classed("hidden", true);
    });
}).catch(function(error) {
  console.error('Error loading data:', error);
});

// Add legend for country colors
const legend = d3.select("#legend");

const categories = ["Good", "Moderate", "Unhealthy for Sensitive Groups", "Unhealthy", "Very Unhealthy", "Hazardous"];

legend.selectAll(".legend-item")
  .data(categories)
  .enter().append("div")
  .attr("class", "legend-item")
  .each(function(d) {
    const group = d3.select(this);
    group.append("span")
      .attr("class", "legend-color")
      .style("background-color", getColor(d));
    group.append("span")
      .attr("class", "legend-text")
      .text(d);
  });

// Function to get color based on AQI category
function getColor(category) {
  switch (category) {
    case "Good":
      return "#00e400";
    case "Moderate":
      return "#ffff00";
    case "Unhealthy for Sensitive Groups":
      return "#ff7e00";
    case "Unhealthy":
      return "#ff0000";
    case "Very Unhealthy":
      return "#99004c";
    case "Hazardous":
      return "#7e0023";
    default:
      return "lightblue";
  }
}
