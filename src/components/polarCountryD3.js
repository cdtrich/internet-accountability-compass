import * as d3 from "npm:d3";
import colorScales from "./scales.js";

/**
 * Animated Polar Chart for Single Country (matching polarD3 style)
 * Exactly mirrors the country cells from polarD3
 *
 * @param {Array} data - Full data
 * @param {string} country - Country to display
 * @param {Object} options - width, height
 */
export function polarCountryD3(data, country, isMobile, options = {}) {
  const { width = 400 } = options;
  const height = width;

  const fillScale = colorScales();

  // Filter to country and latest year
  const latestYear = d3.max(data, (d) => d.year);
  const countryData = data.filter(
    (d) => d.NAME_ENGL === country && d.year === latestYear,
  );

  if (countryData.length === 0) {
    const div = document.createElement("div");
    div.textContent = "No data available";
    div.style.padding = "20px";
    div.style.textAlign = "center";
    return div;
  }

  // Chart dimensions (matching polarD3)
  const radius = width * 0.35;
  const centerX = width / 2;
  const centerY = height / 2;

  // Scales (matching polarD3)
  const angleScale = d3
    .scaleLinear()
    .domain([0, 12])
    .range([0, 2 * Math.PI]);

  const radialScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

  // Helper: polar to cartesian (matching polarD3)
  function polarToCartesian(angle, r) {
    const adjustedAngle = angle - Math.PI / 2;
    return {
      x: r * Math.cos(adjustedAngle),
      y: r * Math.sin(adjustedAngle),
    };
  }

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
    .attr("transform", `translate(${centerX}, ${centerY})`);

  // Reference circles (matching polarD3)
  [100, 80, 60, 40, 20].forEach((val) => {
    g.append("circle")
      .attr("r", radialScale(val))
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3);
  });

  // Total score circle (grey) - matching polarD3
  const totalScore = countryData[0]?.total || 0;
  const totalCircle = g
    .append("circle")
    .attr("r", 0)
    .attr("fill", "#000")
    .attr("fill-opacity", 0.1)
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1);

  // Animate total circle
  totalCircle
    .transition()
    .delay(300)
    .duration(1000)
    .ease(d3.easeQuadOut)
    .attr("r", radialScale(totalScore));

  // White center dot (matching polarD3)
  g.append("circle").attr("r", radialScale(3)).attr("fill", "#fff");

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".polar-country-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip polar-country-tooltip");

  // Draw lines and dots for each commitment (matching polarD3)
  countryData.forEach((d, i) => {
    if (isNaN(d.value) || d.value === null) return;

    const angle = angleScale(d.commitment_num_cardinal - 1);
    const r = radialScale(d.value);
    const pos = polarToCartesian(angle, r);

    // wide cardinal line (from center to value) - matching polarD3
    const lineBg = g
      .append("line")
      .attr("class", `commitment-line commitment-${d.commitment_num_cardinal}`)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
      .attr("stroke", fillScale.getColor(d.pillar_txt))
      .attr("stroke-width", 12)
      .attr("opacity", 0.1);

    // Cardinal line (from center to value) - matching polarD3
    const line = g
      .append("line")
      .attr("class", `commitment-line commitment-${d.commitment_num_cardinal}`)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
      .attr("stroke", fillScale.getColor(d.pillar_txt))
      .attr("stroke-width", 2);

    // Animate wider line drawing
    lineBg
      .transition()
      .delay(400 + i * 50)
      .duration(600)
      .ease(d3.easeQuadOut)
      .attr("x2", pos.x)
      .attr("y2", pos.y);
    // Animate line drawing
    line
      .transition()
      .delay(400 + i * 50)
      .duration(600)
      .ease(d3.easeQuadOut)
      .attr("x2", pos.x)
      .attr("y2", pos.y);

    // Dot at value - matching polarD3
    const dot = g
      .append("circle")
      .attr("class", `commitment-dot commitment-${d.commitment_num_cardinal}`)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", isMobile ? 6 : 8)
      .attr("fill", fillScale.getColor(d.pillar_txt))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("opacity", 0)
      .datum(d);

    // Animate dot appearing
    dot
      .transition()
      .delay(1000 + i * 50)
      .duration(300)
      .attr("cx", pos.x)
      .attr("cy", pos.y)
      .attr("opacity", 1);

    // Hover
    dot
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 8 : 10);

        let scoreColor = fillScale.getColor(d.pillar_txt);

        tooltip.style("visibility", "visible").html(
          `
            <strong style="font-size: 28px; font-weight: bold; color: ${scoreColor}; margin-bottom: 8px;">
            ${Math.floor(d.value)}</strong>
          <br>
            <span style="color: ${scoreColor};">${d.commitment_txt_cardinal}</span><br>
            ${d.pillar_txt}
          `,
        );

        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 6 : 8);
        tooltip.style("visibility", "hidden");
      });
  });

  return svg.node();
}
