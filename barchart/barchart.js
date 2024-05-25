const colorSchemes = {
    'ozone_vs_pm25': ['#d220a5', '#691d82'],
    'no2_vs_co': ['#877505', '#f3e16c'],
    'no2_vs_ozone': ['#0010ff', '#8f94e1'],
    'co_vs_pm25': ['#02ff00', '#3d6e3d'],
    'co_vs_ozone': ['#ff1a1a', '#f67474']
};

const aqiBreakpoints = {
    ozone: [
        { concentration: [0, 54], aqi: [0, 50] },
        { concentration: [55, 70], aqi: [51, 100] },
        { concentration: [71, 85], aqi: [101, 150] },
        { concentration: [86, 105], aqi: [151, 200] },
        { concentration: [106, 200], aqi: [201, 300] },
        { concentration: [201, 404], aqi: [301, 500] },
    ],
    pm25: [
        { concentration: [0, 12], aqi: [0, 50] },
        { concentration: [12.1, 35.4], aqi: [51, 100] },
        { concentration: [35.5, 55.4], aqi: [101, 150] },
        { concentration: [55.5, 150.4], aqi: [151, 200] },
        { concentration: [150.5, 250.4], aqi: [201, 300] },
        { concentration: [250.5, 500.4], aqi: [301, 500] },
    ],
    co: [
        { concentration: [0, 4.4], aqi: [0, 50] },
        { concentration: [4.5, 9.4], aqi: [51, 100] },
        { concentration: [9.5, 12.4], aqi: [101, 150] },
        { concentration: [12.5, 15.4], aqi: [151, 200] },
        { concentration: [15.5, 30.4], aqi: [201, 300] },
        { concentration: [30.5, 50.4], aqi: [301, 500] },
    ],
    no2: [
        { concentration: [0, 53], aqi: [0, 50] },
        { concentration: [54, 100], aqi: [51, 100] },
        { concentration: [101, 360], aqi: [101, 150] },
        { concentration: [361, 649], aqi: [151, 200] },
        { concentration: [650, 1249], aqi: [201, 300] },
        { concentration: [1250, 2049], aqi: [301, 500] },
    ]
};

function convertToAQI(pollutant, value) {
    const breakpoints = aqiBreakpoints[pollutant];
    for (let i = 0; i < breakpoints.length; i++) {
        const { concentration, aqi } = breakpoints[i];
        if (value >= concentration[0] && value <= concentration[1]) {
            return ((aqi[1] - aqi[0]) / (concentration[1] - concentration[0])) * (value - concentration[0]) + aqi[0];
        }
    }
    return value;
}

let selectedCities = [];

d3.csv("global_air_pollution_data_prepared.csv").then(function(data) {
    const countries = Array.from(new Set(data.map(d => d.country_name))).sort();
    const countrySelect = d3.select("#countrySelect");
    countrySelect.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .text(d => d);

    countrySelect.on("change", updateCities);
    d3.select("#differenceSelect").on("change", updateChart);

    function updateCities() {
        const selectedCountry = countrySelect.node().value;
        const citiesData = data.filter(d => d.country_name === selectedCountry);
        selectedCities = d3.shuffle(citiesData).slice(0, 4);
        updateChart();
    }

    function updateChart() {
        const selectedDifference = d3.select("#differenceSelect").node().value;

        if (!selectedCities.length) {
            return;
        }

        const [param1, param2] = selectedDifference.split('_vs_');
        const param1Column = param1 === 'pm25' ? 'pm2.5_aqi_value' : `${param1}_aqi_value`;
        const param2Column = param2 === 'pm25' ? 'pm2.5_aqi_value' : `${param2}_aqi_value`;

        const param1Data = selectedCities.map(d => ({
            city: d.city_name,
            value: convertToAQI(param1, +d[param1Column])
        }));
        const param2Data = selectedCities.map(d => ({
            city: d.city_name,
            value: convertToAQI(param2, +d[param2Column])
        }));

        const svg = d3.select("#barchart");
        const width = +svg.attr("width");
        const height = +svg.attr("height");
        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        svg.selectAll("*").remove();

        const xScale = d3.scaleBand()
            .domain(param1Data.map(d => d.city))
            .range([0, innerWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max([...param1Data, ...param2Data], d => d.value)])
            .nice()
            .range([innerHeight, 0]);

        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g")
            .attr("class", "axis-x")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        g.append("g")
            .attr("class", "axis-y")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-4em")
            .attr("text-anchor", "end")
            .text("AQI Value");

        g.selectAll(".bar-param1")
            .data(param1Data)
            .enter().append("rect")
            .attr("class", "bar-param1")
            .attr("x", d => xScale(d.city))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth() / 2)
            .attr("height", d => innerHeight - yScale(d.value))
            .attr("fill", colorSchemes[selectedDifference][0]);

        g.selectAll(".bar-param2")
            .data(param2Data)
            .enter().append("rect")
            .attr("class", "bar-param2")
            .attr("x", d => xScale(d.city) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth() / 2)
            .attr("height", d => innerHeight - yScale(d.value))
            .attr("fill", colorSchemes[selectedDifference][1]);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${innerWidth + margin.left + 10}, ${margin.top})`);

        const legendItems = [
            { label: param1.toUpperCase(), color: colorSchemes[selectedDifference][0] },
            { label: param2.toUpperCase(), color: colorSchemes[selectedDifference][1] }
        ];

        const legendGroup = legend.selectAll(".legend-item")
            .data(legendItems)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legendGroup.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => d.color);

        legendGroup.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d.label);
    }
    updateCities();
});