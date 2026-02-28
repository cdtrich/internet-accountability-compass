import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";

/**
 * Animated Commitment Beeswarm Plot
 * Shows all countries' scores for each commitment with highlighted country
 *
 * @param {Array} data - Full data
 * @param {string} country - Country to highlight
 * @param {string} pillar - Selected pillar
 * @param {Object} options - width, height
 */
export function straightPlotD3(data, country, pillar, options = {}) {
  const { width = 975 } = options;

  const fillScale = colorScales();
  const pillarColor = fillScale.getColor(pillar);

  // Filter data for selected pillar (exclude NaN values)
  const pillarData = data
    .filter((d) => d.pillar_txt === pillar)
    .filter((d) => !isNaN(d.value) && d.value !== null && d.value !== "NA");
  const countryData = pillarData.filter((d) => d.NAME_ENGL === country);

  // Get unique commitments
  const commitments = Array.from(
    new Set(pillarData.map((d) => d.commitment_txt_cardinal)),
  );

  // Calculate mean per commitment
  const meanByCommitment = d3.rollup(
    pillarData,
    (v) => d3.mean(v, (d) => d.value),
    (d) => d.commitment_txt_cardinal,
  );

  // Group and count countries by commitment + value
  const grouped = d3.rollup(
    pillarData,
    (v) => ({
      count: v.length,
      countries: v.map((d) => d.NAME_ENGL),
      ISO3_CODES: v.map((d) => d.ISO3_CODE),
    }),
    (d) => d.commitment_txt_cardinal,
    (d) => d.value,
  );

  // Flatten for plotting - only group if 5+ countries have same value
  const plotData = [];
  grouped.forEach((values, commitment) => {
    values.forEach((info, value) => {
      if (info.count >= 5) {
        // Group if 5 or more countries
        plotData.push({
          commitment,
          value,
          count: info.count,
          ISO3_CODE: null,
          label: `${info.count} countries`,
        });
      } else {
        // Keep individual countries if less than 5
        info.countries.forEach((countryName, i) => {
          plotData.push({
            commitment,
            value,
            count: 1,
            ISO3_CODE: info.ISO3_CODES[i],
            label: countryName,
          });
        });
      }
    });
  });

  // Dimensions
  const margin = { top: 80, right: 40, bottom: 60, left: 40 };
  const rowHeight = 150;
  const height = commitments.length * rowHeight + margin.top + margin.bottom;

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, width - margin.left - margin.right]);

  const yScale = d3
    .scaleBand()
    .domain(commitments)
    .range([margin.top, height - margin.bottom])
    .padding(0.5);

  const rScale = d3
    .scaleSqrt()
    .domain([1, d3.max(plotData, (d) => d.count)])
    .range([3, 25]);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".straight-plot-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip straight-plot-tooltip");

  // X-axis at top
  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .call(d3.axisTop(xScale).ticks(5).tickSize(0))
    .call((g) => g.select(".domain").remove()) // Remove axis line
    .call((g) => g.selectAll(".tick line").attr("stroke", "#ccc"))
    .selectAll("text")
    .attr("class", "chart-axistext");

  // Grid lines
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left}, 0)`)
    .selectAll("line")
    .data(xScale.ticks(5))
    .join("line")
    .attr("x1", (d) => xScale(d))
    .attr("x2", (d) => xScale(d))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#eee")
    .attr("stroke-width", 1);

  // For each commitment
  commitments.forEach((commitment, idx) => {
    const yPos = yScale(commitment) + yScale.bandwidth() / 2;
    const commitmentData = plotData.filter((d) => d.commitment === commitment);
    const countryValue = countryData.find(
      (d) => d.commitment_txt_cardinal === commitment,
    );
    const meanValue = meanByCommitment.get(commitment);

    // Commitment label
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", yPos - 50)
      .attr("fill", pillarColor)
      .attr("font-size", 18)
      .text(commitment);

    // Collision detection for dots
    const simulation = d3
      .forceSimulation(commitmentData)
      .force("x", d3.forceX((d) => xScale(d.value)).strength(1))
      .force("y", d3.forceY(yPos).strength(0.1))
      .force(
        "collide",
        d3.forceCollide((d) => rScale(d.count) + 1),
      )
      .stop();

    for (let i = 0; i < 120; ++i) simulation.tick();

    // All country dots
    const dots = svg
      .selectAll(`.dot-${idx}`)
      .data(commitmentData)
      .join("circle")
      .attr("class", `dot-${idx}`)
      .attr("cx", margin.left)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => rScale(d.count))
      .attr("fill", pillarColor)
      .attr("fill-opacity", 0.2)
      .attr("stroke", pillarColor)
      .attr("stroke-width", 1)
      .style("cursor", (d) => (d.ISO3_CODE ? "pointer" : "default"))
      .attr("opacity", 0);

    // Animate dots
    dots
      .transition()
      .delay((d, i) => idx * 100 + i * 20)
      .duration(500)
      .ease(d3.easeQuadOut)
      .attr("cx", (d) => margin.left + xScale(d.value))
      .attr("opacity", 1);

    // Hover & click
    dots
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 3);

        tooltip
          .style("visibility", "visible")
          .html(`<strong>${d.label}</strong><br>Score: ${Math.round(d.value)}`);

        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill-opacity", 0.2)
          .attr("stroke-width", 1);

        tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        if (d.ISO3_CODE) {
          window.location.href = `/${d.ISO3_CODE}`;
        }
      });

    // Country highlight
    if (countryValue && !isNaN(countryValue.value)) {
      const diff = countryValue.value - meanValue;
      const comparison =
        diff > 0
          ? `${Math.abs(diff).toFixed(1)} points above average`
          : diff < 0
            ? `${Math.abs(diff).toFixed(1)} points below average`
            : "equal to average";

      // Arrow from country to mean
      if (Math.abs(diff) > 2) {
        svg
          .append("path")
          .attr(
            "d",
            d3.line()([
              [margin.left + xScale(countryValue.value), yPos],
              [margin.left + xScale(meanValue), yPos],
            ]),
          )
          .attr("stroke", "#333")
          .attr("stroke-width", 2)
          .attr("fill", "none")
          .attr("marker-end", "url(#arrow)")
          .attr("opacity", 0)
          .transition()
          .delay(idx * 100 + 600)
          .duration(400)
          .attr("opacity", 1);

        // Arrow marker
        svg
          .append("defs")
          .append("marker")
          .attr("id", "arrow")
          .attr("viewBox", "0 0 10 10")
          .attr("refX", 5)
          .attr("refY", 5)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto-start-reverse")
          .append("path")
          .attr("d", "M 0 0 L 10 5 L 0 10 z")
          .attr("fill", "#333");
      }

      // Country marker
      svg
        .append("line")
        .attr("x1", margin.left + xScale(countryValue.value))
        .attr("x2", margin.left + xScale(countryValue.value))
        .attr("y1", yPos - 15)
        .attr("y2", yPos + 15)
        .attr("stroke", pillarColor)
        .attr("stroke-width", 4)
        .attr("opacity", 0)
        .transition()
        .delay(idx * 100 + 400)
        .duration(300)
        .attr("opacity", 1);

      // Country label
      svg
        .append("text")
        .attr("class", "label-whitestroke")
        .attr("x", margin.left + xScale(countryValue.value))
        .attr("y", yPos + 45)
        .attr("text-anchor", "middle")
        .attr("fill", pillarColor)
        .attr("font-size", 14)
        .attr("font-weight", "bold")
        .attr("opacity", 0)
        .text(country)
        .transition()
        .delay(idx * 100 + 500)
        .duration(300)
        .attr("opacity", 1);

      // Comparison label
      if (idx === 0 && Math.abs(diff) > 2) {
        svg
          .append("text")
          .attr(
            "x",
            margin.left + (xScale(countryValue.value) + xScale(meanValue)) / 2,
          )
          .attr("y", yPos - 35)
          .attr("class", "label-whitestroke")
          .attr("text-anchor", "middle")
          .attr("fill", "#333")
          .attr("font-size", 12)
          .attr("opacity", 0)
          .text(comparison)
          .transition()
          .delay(idx * 100 + 700)
          .duration(300)
          .attr("opacity", 1);
      }
    }
  });

  return svg.node();
}
