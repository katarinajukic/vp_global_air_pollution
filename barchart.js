function createBarChart(countryData, parameter) {
    d3.select("#barchart").selectAll("*").remove();
  
    const margin = { top: 20, right: 30, bottom: 150, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
  
    const svg = d3.select("#barchart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);
  
    const topCities = getTopCities(countryData);
  
    const filteredData = topCities.map(city => {
      return countryData.find(d => d.City === city);
    }).sort((a, b) => b[`${parameter} Value`] - a[`${parameter} Value`]);
  
    x.domain(filteredData.map(d => d.City));
    y.domain([0, d3.max(filteredData, d => +d[`${parameter} Value`])]);
  
    svg.selectAll(".bar")
      .data(filteredData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.City))
      .attr("width", x.bandwidth())
      .attr("y", d => y(+d[`${parameter} Value`]))
      .attr("height", d => height - y(+d[`${parameter} Value`]))
      .attr("fill", "lightblue");
  
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("dx", "-.8em")
      .attr("dy", ".25em")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  
    svg.append("g")
      .call(d3.axisLeft(y));
  
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(`${parameter} Value`);
  }
  
  function getTopCities(countryData) {
    const cityAQISums = {};
    countryData.forEach(d => {
      if (!cityAQISums[d.City]) {
        cityAQISums[d.City] = 0;
      }
      cityAQISums[d.City] += +d["AQI Value"];
    });
  
    return Object.entries(cityAQISums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(d => d[0]);
  }
  
  document.getElementById("parameterSelect").addEventListener("change", function() {
    const selectedParameter = this.value;
    if (currentCountryData) {
      createBarChart(currentCountryData, selectedParameter);
    }
  });
  