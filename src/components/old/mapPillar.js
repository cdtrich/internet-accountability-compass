import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import colorScales from "./scales.js";

export function mapPillar(
  world,
  data,
  property,
  uniqueValues,
  select,
  { width, height }
) {
  // console.log("select mapPillar", select);
  // Filter data if a pillar is selected
  const filteredData = data.filter((d) => d.pillar_txt === select);
  // console.log("data mapPillar filtered", filteredData);

  // Merge the world data with the filtered data
  // Using a Map for O(1) lookups instead of O(n) with find()
  const dataMap = new Map(filteredData.map((item) => [item.ISO3_CODE, item]));

  const worldWithData = world.map((feature) => {
    const matchingData = dataMap.get(feature.properties.ISO3_CODE);

    return matchingData
      ? { ...feature, properties: { ...feature.properties, ...matchingData } }
      : feature;
  });

  // console.log("worldWithData", worldWithData);
  // const labels = [
  //   ...new Set(worldWithData.map((d) => d.properties.group_value)),
  // ];
  // console.log("labels", labels);

  // get colorsScales()
  const fillScale = colorScales();
  // console.log("test", fillScale.getColor("Rights and freedoms", 0));

  // Render the map
  const map = Plot.plot({
    projection: "equal-earth",
    width: width,
    marginTop: 20,
    opacity: {
      legend: false,
      range: [0, 1],
      domain: [0, 100],
    },
    color: {
      legend: true,
      type: "ordinal",
      range: [
        fillScale.getOrdinalCategoryScale(select)("Off track"),
        fillScale.getOrdinalCategoryScale(select)("Catching up"),
        fillScale.getOrdinalCategoryScale(select)("On track"),
        fillScale.getOrdinalCategoryScale(select)("Leading"),
      ],
      domain: ["Off track", "Catching up", "On track", "Leading"],
    },
    marks: [
      // colored countries
      Plot.geo(worldWithData, {
        // fill: (d) =>
        //   isNaN(d.properties.value) ? "#fff" : d.properties.group_value,
        fill: (d) =>
          isNaN(d.properties.value)
            ? "#fff"
            : fillScale.getOrdinalCategoryScale(d.properties.pillar_txt)(
                d.properties.group_value
              ),
        stroke: "#fff",
        strokeWidth: 0.5,
        href: (d) => d.properties.country_url,
      }),
      // Hashing overlay - only for partial data
      Plot.geo(
        worldWithData.filter((d) => d.properties.note === " (partial data)"),
        {
          fill: "url(#white-diagonal-lines)",
          stroke: "none",
          pointerEvents: "none",
        }
      ),
      // World outline
      Plot.geo(worldWithData, {
        stroke: (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"),
        strokeWidth: 0.5,
      }),
      // country labels
      Plot.tip(
        worldWithData,
        Plot.centroid(
          Plot.pointer({
            title: (d) =>
              `${
                d.properties.note === " (partial data)"
                  ? Math.round(d.properties.value, 1) + d.properties.note
                  : Math.round(d.properties.value, 1)
              }\n${d.properties.NAME_ENGL}`,
            stroke: "#fff",
          })
        )
      ),
    ],
  });

  // Add the pattern definition after creating the plot
  const svg = d3.select(map).select("svg");
  svg.insert("defs", ":first-child").html(`
  <pattern id="white-diagonal-lines" patternUnits="userSpaceOnUse" width="4.2425" height="4.2425" patternTransform="rotate(45)">
    <rect x="0" y="0" width="1.5" height="4.2425" fill="white"/>
  </pattern>
`);

  // Find the existing color legend
  // Observable Plot typically uses aria-label="color" or aria-label="color-legend"
  let existingLegend = svg.select('[aria-label*="color"]');

  // If not found, try to find it by looking for the swatches
  if (existingLegend.empty()) {
    existingLegend = svg.select("g").filter(function () {
      return d3.select(this).select(".plot-swatch").size() > 0;
    });
  }

  // Calculate position based on existing legend
  // let translateX = 10;
  // let translateY = height;

  if (!existingLegend.empty()) {
    const legendNode = existingLegend.node();
    const bbox = legendNode.getBBox();
    const transform = legendNode.getAttribute("transform");

    // Parse the transform to get the legend's position
    const match = transform
      ? transform.match(/translate\(([^,]+),([^)]+)\)/)
      : null;
    if (match) {
      translateX = parseFloat(match[1]);
      translateY = parseFloat(match[2]) + bbox.height + 20; // 20px gap below existing legend
    }
  }

  // Add custom legend for partial data
  // const legendG = svg
  //   .append("g")
  //   .attr("class", "partial-data-legend")
  //   .attr("transform", `translate(${translateX}, ${translateY})`);

  // fixed offset
  const legendG = svg
    .append("g")
    .attr("class", "partial-data-legend")
    .attr("transform", `translate(0, 20)`); // Adjust this value based on your needs

  // Add background rect for visibility
  // legendG
  //   .append("rect")
  //   .attr("x", -5)
  //   .attr("y", -5)
  //   .attr("width", 180)
  //   .attr("height", 25)
  //   .attr("fill", "white")
  //   .attr("fill-opacity", 0.8)
  //   .attr("stroke", "none")
  //   .attr("stroke-width", 0.5);

  // Add the pattern square
  legendG
    .append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", "#aaa");

  legendG
    .append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", "url(#white-diagonal-lines)");

  // Add the text
  legendG
    .append("text")
    .attr("x", 23)
    .attr("y", 9)
    .attr("font-size", "12px")
    .attr("font-family", "system-ui, sans-serif")
    .attr("fill", "#000")
    .style("dominant-baseline", "middle")
    .text("Partial data (â‰¥1 indicator missing)");

  // return
  return map;
}
