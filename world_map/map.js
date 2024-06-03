const width = 900;
const height = 700;

const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(d3.zoom()
    .scaleExtent([1, 90])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", function (event) {
      g.attr("transform", event.transform);
    }));

svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "lightblue");

const g = svg.append("g");

const projection = d3.geoMercator()
  .scale(150)
  .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

let currentCountryData = null;
let globalData = null;

Promise.all([
  d3.json("../csv/countries-110m.json"),
  d3.csv("../csv/world_air_pollution_data.csv")
]).then(function([topology, data]) {
  console.log('TopoJSON Loaded:', topology);
  console.log('Air Pollution Data Loaded:', data);

  globalData = data;

  const geojson = topojson.feature(topology, topology.objects.countries);

  console.log('GeoJSON Features:', geojson.features);

  const countries = geojson.features;

  console.log('Country Names from GeoJSON:', countries.map(d => d.properties.name));
  console.log('Unique Country Names from CSV:', [...new Set(data.map(d => d.Country))]);

  const countryDataMap = {};
  data.forEach(d => {
    if (!countryDataMap[d.Country]) {
      countryDataMap[d.Country] = [];
    }
    countryDataMap[d.Country].push(d);
  });

  g.selectAll("path")
    .data(countries)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", function(d) {
      const countryName = d.properties.name;
      const countryData = countryDataMap[countryName];
      if (countryData) {
        return getColor(countryData[0]["AQI Category"]);
      } else {
        console.log(`No data for country: ${countryName}`);
        return "#00e400";
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
          .html(`<strong>${countryName}</strong><br>AQI: ${countryData[0]["AQI Value"]}<br>Category: ${getColoredCircle(countryData[0]["AQI Category"])} ${countryData[0]["AQI Category"]}`)
          .classed("hidden", false);
      }
    })
    .on("mouseout", function() {
      d3.select("#tooltip").classed("hidden", true);
    })
    .on("click", function(event, d) {
      const countryName = d.properties.name;
      const countryData = countryDataMap[countryName];
      if (countryData) {
        currentCountryData = countryData;
        const selectedParameter = document.getElementById('parameterSelect').value;
        createBarChart(currentCountryData, selectedParameter);
      }
    });

  g.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", function(d) {
        return projection([d.lng, d.lat])[0];
    })
    .attr("cy", function(d) {
        return projection([d.lng, d.lat])[1];
    })
    .attr("r", 0.5)
    .attr("fill", "black")
    .attr("opacity", 0.8)
    .on("mouseover", function(event, d) {
        const [x, y] = d3.pointer(event);
        d3.select("#tooltip")
            .style("left", `${x + 10}px`)
            .style("top", `${y + 10}px`)
            .html(`<strong>${d.City}</strong><br>
                AQI: ${d["AQI Value"]} ${getColoredCircle(d["AQI Category"])}<br>
                CO AQI: ${d["CO AQI Value"]} ${getColoredCircle(d["CO AQI Category"])}<br>
                Ozone AQI: ${d["Ozone AQI Value"]} ${getColoredCircle(d["Ozone AQI Category"])}<br>
                NO2 AQI: ${d["NO2 AQI Value"]} ${getColoredCircle(d["NO2 AQI Category"])}<br>
                PM2.5 AQI: ${d["PM2.5 AQI Value"]} ${getColoredCircle(d["PM2.5 AQI Category"])}`)
            .classed("hidden", false);
    })
    .on("mouseout", function() {
        d3.select("#tooltip").classed("hidden", true);
    });
}).catch(function(error) {
  console.error('Error loading data:', error);
});

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

function getColoredCircle(category) {
  return `<span style="display:inline-block;width:10px;height:10px;background-color:${getColor(category)};border-radius:50%;"></span>`;
}

document.getElementById("parameterSelect").addEventListener("change", function() {
  const selectedParameter = this.value;
  if (currentCountryData) {
    createBarChart(currentCountryData, selectedParameter);
  }
});
