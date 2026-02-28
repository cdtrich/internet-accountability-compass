import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";

/**
 * Historical Line Chart for Indicator
 * Shows all countries over time, highlighting the selected country
 *
 * @param {Array} data - Full data with all years
 * @param {string} country - Country to highlight
 * @param {string} pillar - Pillar to filter
 * @param {string} indicator - Specific indicator/commitment
 * @param {Object} options - width, height
 */
export function indicatorHistorical(
  data,
  country,
  pillar,
  indicator,
  options = {},
) {
  const { width = 320, height = 250 } = options;

  const fillScale = colorScales();
  const pillarColor = fillScale.getColor(pillar);

  // Filter to pillar and indicator
  const indicatorData = data
    .filter(
      (d) => d.pillar_txt === pillar && d.commitment_txt_cardinal === indicator,
    )
    .filter((d) => !isNaN(d.value) && d.value !== null && d.value !== "NA");

  if (indicatorData.length === 0) {
    const div = document.createElement("div");
    div.textContent = "No historical data available";
    div.style.padding = "20px";
    div.style.textAlign = "center";
    div.style.fontSize = "12px";
    return div;
  }

  // Group by country
  const byCountry = d3.group(indicatorData, (d) => d.NAME_ENGL);

  // Dimensions
  const margin = { top: 40, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const yearExtent = d3.extent(indicatorData, (d) => d.year);
  const xScale = d3.scaleLinear().domain(yearExtent).range([0, innerWidth]);

  const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  // X-axis (every year, no line)
  g.append("g")
    .attr("transform", `translate(0, ${innerHeight + 10})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(yearExtent[1] - yearExtent[0])
        .tickFormat(d3.format("d"))
        .tickSize(0),
    )
    .call((g) => g.select(".domain").remove())
    .selectAll("text")
    .attr("class", "chart-axistext");

  // Y-axis (intervals of 25, no line)
  g.append("g")
    .call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]).tickSize(0))
    .call((g) => g.select(".domain").remove())
    .selectAll("text")
    .attr("dx", -5)
    .attr("class", "chart-axistext");

  // Grid lines
  g.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data([0, 25, 50, 75, 100])
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "#eee")
    .attr("stroke-width", 1);

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".indicator-historical-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip indicator-historical-tooltip");

  // Draw all countries (background)
  byCountry.forEach((countryData, countryName) => {
    if (countryName === country) return; // Skip selected country for now

    const sortedData = countryData.sort((a, b) => a.year - b.year);

    g.append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", pillarColor)
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.2)
      .attr("d", line);
  });

  // Draw selected country (foreground)
  const selectedCountryData = byCountry.get(country);
  if (selectedCountryData) {
    const sortedData = selectedCountryData.sort((a, b) => a.year - b.year);

    g.append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", pillarColor)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Dots for selected country (all hollow except last)
    g.selectAll(".selected-dot")
      .data(sortedData)
      .join("circle")
      .attr("class", "selected-dot")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", (d, i) => (i === sortedData.length - 1 ? 5 : 3))
      .attr("fill", (d, i) =>
        i === sortedData.length - 1 ? pillarColor : "#fff",
      )
      .attr("stroke", pillarColor)
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", (d, i) => (i === sortedData.length - 1 ? 7 : 5));

        tooltip
          .style("visibility", "visible")
          .html(`<strong>${Math.round(d.value)}</strong> (${d.year})`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", function (event, d) {
        const i = sortedData.indexOf(d);
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", i === sortedData.length - 1 ? 5 : 3);

        tooltip.style("visibility", "hidden");
      });
  }

  // Title (indicator name)
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 13)
    .attr("font-weight", "bold")
    .attr("fill", pillarColor)
    .text(indicator);

  return svg.node();
}
