import * as d3 from "npm:d3";
import colorScales from "./scales.js";

/**
 * Animated Historical Trends for Country Pillars
 * Shows all 4 pillars over time with drawing animations
 *
 * @param {Array} data - Cardinal data with year, pillar_txt, value
 * @param {string} country - Country name
 * @param {Object} options - width, height
 */
export function pillarTrendsD3(data, country, options = {}) {
  const { width = 975, height = 400 } = options;

  const fillScale = colorScales();

  // Filter to country and get pillar data (exclude Total score)
  const countryData = data
    .filter((d) => d.NAME_ENGL === country && d.pillar_txt !== "Total score")
    .filter((d) => d.value !== null && d.value !== "NA" && !isNaN(d.value))
    .sort((a, b) => a.year - b.year);

  if (countryData.length === 0) {
    const div = document.createElement("div");
    div.textContent = "No historical data available";
    div.style.padding = "20px";
    div.style.textAlign = "center";
    return div;
  }

  // Group by pillar
  const pillarGroups = d3.group(countryData, (d) => d.pillar_txt);

  // Scales
  const yearExtent = d3.extent(countryData, (d) => d.year);
  const xScale = d3
    .scaleLinear()
    .domain(yearExtent)
    .range([60, width - 40]);

  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - 40, 40]);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveCatmullRom);

  // X-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - 40})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(yearExtent[1] - yearExtent[0])
        .tickFormat(d3.format("d")),
    )
    .call((g) => g.select(".domain").attr("stroke", "#ccc"))
    .call((g) => g.selectAll(".tick line").attr("stroke", "#ccc"));

  // Y-axis
  svg
    .append("g")
    .attr("transform", `translate(60, 0)`)
    .call(d3.axisLeft(yScale).ticks(5))
    .call((g) => g.select(".domain").attr("stroke", "#ccc"))
    .call((g) => g.selectAll(".tick line").attr("stroke", "#ccc"))
    .call((g) =>
      g
        .append("text")
        .attr("x", -30)
        .attr("y", 20)
        .attr("fill", "#333")
        .attr("text-anchor", "start")
        .attr("font-size", 12)
        .text("Score"),
    );

  // Grid lines
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(60, 0)`)
    .call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickSize(-(width - 100))
        .tickFormat(""),
    )
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke", "#eee"));

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".pillar-trends-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip pillar-trends-tooltip");

  // Draw each pillar
  let animationDelay = 0;
  const animationDuration = 1500;
  const staggerDelay = 200;

  Array.from(pillarGroups.entries()).forEach(([pillar, pillarData], i) => {
    const pillarColor = fillScale.getColor(pillar);

    // Line path with animation
    const path = svg
      .append("path")
      .datum(pillarData)
      .attr("fill", "none")
      .attr("stroke", pillarColor)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate line drawing
    const pathLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .delay(animationDelay)
      .duration(animationDuration)
      .ease(d3.easeQuadInOut)
      .attr("stroke-dashoffset", 0);

    // Dots with fade-in animation
    const dots = svg
      .selectAll(`.dot-${i}`)
      .data(pillarData)
      .join("circle")
      .attr("class", `dot-${i}`)
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 5)
      .attr("fill", pillarColor)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("opacity", 0);

    // Animate dots fading in after line
    dots
      .transition()
      .delay((d, j) => animationDelay + animationDuration + j * 50)
      .duration(300)
      .ease(d3.easeQuadOut)
      .attr("opacity", 1);

    // Hover interactions for dots
    dots
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 7)
          .attr("stroke-width", 3);

        tooltip.style("visibility", "visible").html(
          `
            <strong>${pillar}</strong><br>
            Year: ${d.year}<br>
            Score: ${Math.round(d.value)}
          `,
        );

        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 5)
          .attr("stroke-width", 2);

        tooltip.style("visibility", "hidden");
      });

    // Pillar label at end of line
    const lastPoint = pillarData[pillarData.length - 1];
    svg
      .append("text")
      .attr("x", xScale(lastPoint.year) + 10)
      .attr("y", yScale(lastPoint.value))
      .attr("dy", "0.35em")
      .attr("fill", pillarColor)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("opacity", 0)
      .text(pillar.split(" ")[0]) // First word of pillar name
      .transition()
      .delay(animationDelay + animationDuration)
      .duration(300)
      .attr("opacity", 1);

    animationDelay += staggerDelay;
  });

  // Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text(`${country} - Historical Trends by Pillar`);

  return svg.node();
}
