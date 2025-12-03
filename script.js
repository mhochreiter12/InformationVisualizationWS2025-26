const svg = d3.select("#chart");

const margin = { top: 40, right: 120, bottom: 40, left: 120 };
const width = 1000 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let fullData;

d3.csv("f1_grid_race_comp.csv").then(data => {
  data.forEach(d => {
    d.year = +d.year;
    d.raceId = +d.raceId;
    d.grid = +d.grid;
    d.position = d.position === "\\N" ? null : +d.position;
  });

  fullData = data;

  plotDropdowns(data);
  plotChart();
});

function plotDropdowns(data) {
  const years = [...new Set(data.map(d => d.year))].sort();

  d3.select("#yearDropdown")
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .text(d => d)
    .attr("value", d => d);

  d3.select("#yearDropdown").on("change", plotRaceDropdown);
  d3.select("#raceDropdown").on("change", plotChart);

  plotRaceDropdown();
}

function plotRaceDropdown() {
  const year = +d3.select("#yearDropdown").property("value");

  const races = fullData
    .filter(d => d.year === year)
    .reduce((acc, d) => {
      acc[d.raceId] = d.circuitName;
      return acc;
    }, {});

  const raceEntries = Object.entries(races);

  const dropdown = d3.select("#raceDropdown");
  dropdown.selectAll("option").remove();

  dropdown.selectAll("option")
    .data(raceEntries)
    .enter()
    .append("option")
    .text(d => d[1])
    .attr("value", d => d[0]);

  plotChart();
}

function plotChart() {
  const year = +d3.select("#yearDropdown").property("value");
  const raceId = +d3.select("#raceDropdown").property("value");

  let raceData = fullData.filter(
    d => d.year === year && d.raceId === raceId && d.grid > 0
  );

  console.log(raceData)
  
  g.selectAll("*").remove();

  if (raceData.length === 0) return;

  // Scales
  const y = d3.scaleLinear()
      .domain([1, d3.max(raceData, d => Math.max(d.grid, d.position))])
      .range([0, height]);

  const xQuali = 100;
  const xRace = width - 100;

  const constructorColor = d3.scaleOrdinal([
  "#771155", "#114477", "#117744", "#AAAA44", "#774411", "#77CCCC", "#CC99BB", "#4477AA",  "#77AADD", "#117777", 
  "#44AAAA",  "#44AA77", "#88CCAA", "#777711", "#DDDD77", "#AA4488", "#AA7744", "#DDAA77", "#771122", "#AA4455", "#DD7788"])

  // Slope lines
g.selectAll(".slope")
  .data(raceData.filter(d => d.position !== null))
  .enter()
  .append("line")
  .attr("class", "slope")
  .attr("data-constructor", d => d.constructorName)
  .attr("x1", xQuali)
  .attr("y1", d => y(d.grid))
  .attr("x2", xRace)
  .attr("y2", d => y(d.position))
  .attr("stroke", d => constructorColor(d.constructorName))
  .attr("stroke-width", 2);

  // Labels Starting Grid
g.selectAll(".labelQ")
  .data(raceData)
  .enter()
  .append("text")
  .attr("x", xQuali - 10)
  .attr("y", d => y(d.grid))
  .attr("text-anchor", "end")
  .style("font-size", "12px")
  .style("fill", d => d.position === null ? "gray" : constructorColor(d.constructorName))
  .text(d => {
      const dnf = !d.position ? " (DNF)" : "";
      return `${d.grid}. ${d.driverName}${dnf}`;
  });

  // Labels Finishing results
  g.selectAll(".labelR")
    .data(raceData.filter(d => d.position !== null))
    .enter()
    .append("text")
    .attr("x", xRace + 10)
    .attr("y", d => y(d.position))
    .attr("text-anchor", "start")
    .style("font-size", "12px")
    .style("fill", d => constructorColor(d.constructorName))
    .text(d => `${d.position}. ${d.driverName}`);

  g.append("text")
    .attr("x", xQuali)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .text("Starting Grid");

  g.append("text")
    .attr("x", xRace)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .text("Finishing Position");

  g.append("text")
  .attr("x", 0)
  .attr("y", height + 30)
  .style("font-size", "12px")
  .style("fill", "gray")
  .text("DNF = Did Not Finish");

// Legend
g.selectAll(".legend").remove();

const constructors = [...new Set(raceData.map(d => d.constructorName))];

const legend = g.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width + 100}, 20)`);

const legendItems = legend.selectAll(".legend-item")
  .data(constructors)
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("data-constructor", d => d)
  .attr("transform", (_, i) => `translate(0, ${i * 18})`)
  .style("cursor", "pointer");

// Legend title
legend.append("text")
  .attr("x", 0)
  .attr("y", -10)
  .style("font-size", "16px")
  .text("Constructors");

// Legend color box
legendItems.append("rect")
  .attr("width", 12)
  .attr("height", 12)
  .attr("fill", d => constructorColor(d));

// Legend text
legendItems.append("text")
  .attr("x", 18)
  .attr("y", 10)
  .style("font-size", "12px")
  .style("font-weight", "normal")
  .text(d => d)
  .on("mouseover", function () {
      d3.select(this).style("font-weight", "bold");
  })
  .on("mouseout", function () {
      d3.select(this).style("font-weight", "normal");
  });

// Accessibility feature: Highlight constructors on hovering
legendItems.on("mouseover", function () {
    const constructor = d3.select(this).attr("data-constructor");

    g.selectAll(".slope")
      .transition().duration(150)
      .attr("stroke-opacity", d =>
        d.constructorName === constructor ? 1 : 0.15
      )
      .attr("stroke-width", d =>
        d.constructorName === constructor ? 5 : 1
      );
  })
  .on("mouseout", function () {
    g.selectAll(".slope")
      .transition().duration(150)
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 2);
  });
}
