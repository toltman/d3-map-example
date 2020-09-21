let body = d3.select("body");
Promise.all([
  d3.csv("/state_populations.csv"),
  d3.json("/gz_2010_us_040_00_500k.json"),
  d3.json("state_capitals.geojson"),
])
  .then(showData)
  .then(displayOnHover);

function showData(datasources) {
  let [data, mapInfo, capitals] = datasources;

  let bodyHeight = 400;
  let bodyWidth = 800;

  // console.log(data);
  // console.log(mapInfo);
  // let statesList = mapInfo.features.map((d) => d.properties.NAME);
  // console.log(statesList);

  // filter out Alaska and Hawaii
  mapInfo.features = mapInfo.features.filter((state) => {
    return (state.properties.NAME == "Alaska") |
      (state.properties.NAME == "Hawaii")
      ? false
      : true;
    // if (
    //   (state.properties.NAME == "Alaska") |
    //   (state.properties.NAME == "Hawaii")
    // ) {
    //   return false;
    // } else {
    //   return true;
    // }
  });

  mapInfo.features.forEach((elem) => {
    // find the matching state
    let state = data.find((s) => s.State == elem.properties.NAME);

    // set the mapInfo population to the matching state's population
    elem.properties.population = parseFloat(state.Population.replace(/,/g, ""));
  });

  console.log(mapInfo.features);

  let projection = d3
    .geoMercator()
    //.geoNaturalEarth1()
    .scale(500)
    .translate([bodyWidth + 400, bodyHeight + 200]);

  let path = d3.geoPath().projection(projection);

  // create color scale
  let maxPop = d3.max(mapInfo.features, (d) => d.properties.population);
  let medianPop = d3.median(mapInfo.features, (d) => d.properties.population);
  let cScale = d3
    .scaleLinear()
    .domain([0, medianPop, maxPop])
    .range(["white", "orange", "red"]);

  let chart = body.select("#chart");

  chart
    .selectAll("path")
    .data(mapInfo.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke", "none")
    .attr("fill", (d) =>
      d.properties.population ? cScale(d.properties.population) : "white"
    )
    .attr("class", (d) => d.properties.NAME.replace(/ /g, ""));

  d3.select("#chart").attr("height", bodyHeight).attr("width", bodyWidth);

  // add state capitals
  let p = d3
    .geoMercator()
    .scale(500)
    .translate([bodyWidth + 400, bodyHeight + 200]);

  chart
    .selectAll("#marks")
    .data(capitals.features)
    .enter()
    .append("circle")
    .attr("cx", (d) => p(d.geometry.coordinates)[0])
    .attr("cy", (d) => p(d.geometry.coordinates)[1])
    .attr("r", 2);

  // displaying capital city names is currently disabled
  // by display: none on text in the CSS
  chart
    .selectAll("#text")
    .data(capitals.features)
    .enter()
    .append("text")
    .attr("x", (d) => p(d.geometry.coordinates)[0] - 5)
    .attr("y", (d) => p(d.geometry.coordinates)[1] - 5)
    .attr("class", (d) => d.properties.state.replace(/ /g, ""))
    .text((d) => d.properties.name)
    .style("cursor", "default");
}

function displayOnHover() {
  let chart = document.querySelector("#chart");
  chart.addEventListener("mouseover", (e) => {
    currState = e.target.getAttribute("class");
    if (currState) {
      document.querySelector(`text.${currState}`).style.display = "inline";
    }
  });
  chart.addEventListener("mouseout", (e) => {
    currState = e.target.getAttribute("class");
    if (currState) {
      document.querySelector(`text.${currState}`).style.display = "none";
    }
  });
}
