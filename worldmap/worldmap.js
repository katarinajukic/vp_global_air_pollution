const width = 1000, height = 700;

const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath()
    .projection(projection);

const colorScale = d3.scaleOrdinal()
    .domain([1, 2, 3, 4, 5, 6])
    .range(["#00e400", "#ffff00", "#ff7e00", "#ff0000", "#99004c", "#7e0023"]);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const legendData = [
    { label: "Good", color: "#00e400" },
    { label: "Moderate", color: "#ffff00" },
    { label: "Unhealthy for Sensitive Groups", color: "#ff7e00" },
    { label: "Unhealthy", color: "#ff0000" },
    { label: "Very Unhealthy", color: "#99004c" },
    { label: "Hazardous", color: "#7e0023" }
];

const legend = svg.selectAll(".legend")
    .data(legendData)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", d => d.color);

legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(d => d.label);

d3.json("https://d3js.org/world-110m.v1.json").then(world => {
    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#333");

    // Load and process pollution data
    d3.csv("../csv/global_air_pollution_data_prepared_all.csv").then(pollutionData => {
        // Ensure latitude and longitude are numbers
        pollutionData.forEach(d => {
            d.lat = +d.lat;
            d.lon = +d.lon;
        });

        console.log(pollutionData); // Log loaded data to console

        pollutionData.forEach(d => {
            console.log("City:", d.city_name, "Country:", d.country_name);
            console.log("AQI:", d.aqi_value, "CO AQI:", d.co_aqi_value);
            // Log other parameters as needed
        });

        svg.selectAll("circle")
            .data(pollutionData)
            .enter().append("circle")
            .attr("cx", d => projection([d.lon, d.lat])[0])
            .attr("cy", d => projection([d.lon, d.lat])[1])
            .attr("r", 5)
            .attr("fill", d => colorScale(d.aqi_category))
            .on("mouseover", function (event, d) {
                console.log("Mouseover event triggered.");
                console.log("Data associated with circle:", d);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`
                    <strong>${d.city_name}, ${d.country_name}</strong><br>
                    <table class="city-details">
                        <tr><td>AQI:</td><td>${d.aqi_value} (${getAQICategory(d.aqi_category)})</td></tr>
                        <tr><td>CO:</td><td>${d.co_aqi_value} (${getAQICategory(d.co_aqi_category)})</td></tr>
                        <tr><td>O3:</td><td>${d.ozone_aqi_value} (${getAQICategory(d.ozone_aqi_category)})</td></tr>
                        <tr><td>NO2:</td><td>${d.no2_aqi_value} (${getAQICategory(d.no2_aqi_category)})</td></tr>
                        <tr><td>PM2.5:</td><td>${d["pm2.5_aqi_value"]} (${getAQICategory(d["pm2.5_aqi_category"])})</td></tr>
                    </table>
                `)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    });
});

function getAQICategory(category) {
    switch (category) {
        case "1": return "Good";
        case "2": return "Moderate";
        case "3": return "Unhealthy for Sensitive Groups";
        case "4": return "Unhealthy";
        case "5": return "Very Unhealthy";
        case "6": return "Hazardous";
        default: return "Unknown";
    }
}
