import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";

/**
 * Create inline sparkline for a pillar with value labels
 * Shows historical trend with labeled values
 *
 * @param {Array} data - Cardinal data for country
 * @param {string} pillar - Pillar name
 * @returns {HTMLElement} SVG DOM node
 */
export function pillarSparklineD3(data, pillar) {
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

  // Dimensions - larger for visibility
  const width = 380;
  const height = 180;
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 20;

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
    .style("display", "block");

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveCatmullRom);

  // Draw line
  svg
    .append("path")
    .datum(pillarData)
    .attr("fill", "none")
    .attr("stroke", pillarColor)
    .attr("stroke-width", 3)
    .attr("d", line);

  // Dots with labels
  pillarData.forEach((d, i) => {
    const isFirst = i === 0;
    const isLast = i === pillarData.length - 1;

    // Dot
    svg
      .append("circle")
      .attr("cx", xScale(d.year))
      .attr("cy", yScale(d.value))
      .attr("r", 3)
      .attr("r", (d, i) => (i === pillarData.length - 1 ? 5 : 3)) // not working
      .attr("fill", (d, i) =>
        i === pillarData.length - 1 ? pillarColor : "#fff",
      )
      .attr("stroke", pillarColor)
      .attr("stroke-width", 2);

    // Value label above (all points)
    svg
      .append("text")
      .attr("x", xScale(d.year))
      .attr("y", yScale(d.value) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .attr("fill", "#000")
      .text(Math.round(d.value));

    // Year label below (only first and last)
    if (isFirst || isLast) {
      const shortYear = `'${String(d.year).slice(-2)}`;
      svg
        .append("text")
        .attr("x", xScale(d.year))
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("fill", "#333")
        .text(shortYear);
    }
  });

  return svg.node();
}
