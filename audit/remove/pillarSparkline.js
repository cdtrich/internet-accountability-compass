import * as d3 from "npm:d3";
import colorScales from "./scales.js";

/**
 * Create inline sparkline for a pillar
 * Shows historical trend with latest value labeled
 *
 * @param {Array} data - Cardinal data for country
 * @param {string} pillar - Pillar name
 * @returns {HTMLElement} SVG DOM node
 */
export function pillarSparkline(data, pillar) {
  const fillScale = colorScales();
  const pillarColor = fillScale.getColor(pillar);

  // Filter to pillar and sort by year
  const pillarData = data
    .filter((d) => d.pillar_txt === pillar)
    .filter((d) => d.value !== null && d.value !== "NA" && !isNaN(d.value))
    .sort((a, b) => a.year - b.year);

  if (pillarData.length === 0) {
    return document.createElement("span"); // Return empty span if no data
  }

  // Dimensions
  const width = 100;
  const height = 30;
  const marginLeft = 5;
  const marginRight = 20;
  const marginTop = 5;
  const marginBottom = 5;

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(pillarData, (d) => d.year))
    .range([marginLeft, width - marginRight]);

  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - marginBottom, marginTop]);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("class", "pillar-sparkline")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("display", "inline-block")
    .style("vertical-align", "middle")
    .style("margin-left", "10px");

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  // Draw line
  svg
    .append("path")
    .datum(pillarData)
    .attr("fill", "none")
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2)
    .attr("d", line);

  // Dots at each point
  svg
    .selectAll("circle")
    .data(pillarData)
    .join("circle")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.value))
    .attr("r", 2)
    .attr("fill", pillarColor);

  // Latest value label
  const latest = pillarData[pillarData.length - 1];
  svg
    .append("text")
    .attr("x", xScale(latest.year) + 5)
    .attr("y", yScale(latest.value))
    .attr("dy", "0.35em")
    .attr("font-size", 11)
    .attr("font-weight", "bold")
    .attr("fill", pillarColor)
    .text(Math.round(latest.value));

  return svg.node(); // Return DOM node, not HTML string
}
