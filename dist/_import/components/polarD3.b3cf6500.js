import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";
import { wrapText } from "./wrapText.b40b5f45.js";
import { basePath } from "./basePath.f78a24ae.js";

/**
 * D3 Polar Chart - Small Multiples with Linked Brushing
 * Grid of radar charts, one per country, with legend in top-left
 * Hovering a commitment highlights it across ALL charts
 *
 * @param {Array} data - Data with commitment_num, value, pillar_txt, NAME_ENGL, total
 * @param {boolean} isMobile - Mobile flag
 * @param {Object} options - Chart options (width)
 */
export function polar(data, isMobile, options = {}) {
  const { width = 640 } = options;

  console.log("polar called");
  console.log("data length:", data.length);
  console.log("countries:", [...new Set(data.map((d) => d.NAME_ENGL))].length);
  console.log("isMobile:", isMobile);
  console.log("width:", width);

  // Get color scale
  const fillScale = colorScales();

  // Get unique countries
  const countries = [...new Set(data.map((d) => d.NAME_ENGL))].sort();

  // Get unique commitments and pillars
  const commitments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const pillars = [...new Set(data.map((d) => d.pillar_txt))];

  // Grid layout
  const cols = isMobile ? 1 : 5;
  const countryRows = isMobile
    ? countries.length
    : Math.ceil(countries.length / cols);
  const rows = countryRows + 1; // +1 for legend row at top

  // Cell dimensions - DEFINE THESE BEFORE USING THEM
  const cellWidth = (width * 0.9) / cols;
  const cellHeight = cellWidth; // Square cells
  const radius = cellWidth * 0.35; // Polar chart radius

  const totalWidth = width * 0.9;
  const totalHeight = isMobile ? width * 80 : rows * cellHeight;

  console.log("cols:", cols);
  console.log("countryRows:", countryRows);
  console.log("rows:", rows);
  console.log("totalHeight:", totalHeight);

  // CREATE SVG - THIS IS MISSING!
  const svg = d3
    .create("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("viewBox", [0, 0, totalWidth, totalHeight])
    .attr("style", "max-width: 100%; height: auto;");

  // Angle scale for commitments - ALSO MISSING!
  const angleScale = d3
    .scaleLinear()
    .domain([0, 12])
    .range([0, 2 * Math.PI]);

  // Radial scale (0-100 scores) - ALSO MISSING!
  const radialScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

  // Create grid cells
  const cells = [];

  // Legend at CENTER of first row (position 2 = middle)
  cells.push({
    type: "legend",
    x: isMobile ? 0 : 2 * cellWidth,
    y: 0,
    col: isMobile ? 0 : 2,
    row: 0,
  });

  // Countries start at row 1 (second row)
  countries.forEach((country, i) => {
    const col = isMobile ? 0 : i % cols;
    const row = isMobile ? i + 1 : Math.floor(i / cols) + 1;

    cells.push({
      type: "country",
      country,
      x: col * cellWidth,
      y: row * cellHeight,
      col,
      row,
      data: data.filter((d) => d.NAME_ENGL === country),
    });
  });

  // Helper: polar to cartesian
  function polarToCartesian(angle, r) {
    // Rotate to start at top (subtract π/2)
    const adjustedAngle = angle - Math.PI / 2;
    return {
      x: r * Math.cos(adjustedAngle),
      y: r * Math.sin(adjustedAngle),
    };
  }

  // Draw each cell
  cells.forEach((cell) => {
    const g = svg
      .append("g")
      .attr("class", cell.type === "legend" ? "legend-cell" : "country-cell")
      .attr(
        "transform",
        `translate(${cell.x + cellWidth / 2}, ${cell.y + cellHeight / 2})`,
      );

    if (cell.type === "legend") {
      // LEGEND CELL
      drawLegend(g, radius);
    } else {
      // COUNTRY CELL
      drawCountryChart(g, cell, radius);
    }
  });

  // Draw legend
  function drawLegend(g, r) {
    // Define pillar ranges (commitment numbers)
    const pillarRanges = [
      {
        name: "Connectivity and infrastructure",
        commitments: [1, 2, 3],
        color: pillars[0],
      },
      {
        name: "Rights and freedoms",
        commitments: [4, 5, 6],
        color: pillars[1],
      },
      {
        name: "Responsibility and sustainability",
        commitments: [7, 8, 9],
        color: pillars[2],
      },
      {
        name: "Trust and resilience",
        commitments: [10, 11, 12],
        color: pillars[3],
      },
    ];

    // Draw shaded areas between boundary lines for each pillar
    pillarRanges.forEach((pillar, i) => {
      // Get boundary commitment numbers (first and last in range)
      const startCommitment = pillar.commitments[0];
      const endCommitment = pillar.commitments[2];

      // For d3.arc() - NO π/2 subtraction
      const startAngleArc = angleScale(startCommitment - 1);
      const endAngleArc = angleScale(endCommitment - 1);

      // For lines/text - WITH π/2 subtraction
      const startAngleLine = startAngleArc - Math.PI / 2;
      const endAngleLine = endAngleArc - Math.PI / 2;

      // total circle
      const totalCircle = g
        .append("circle")
        .attr("r", radialScale(65))
        .attr("fill", "#000")
        .attr("fill-opacity", 0.025)
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1);

      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radialScale(100))
        .startAngle(startAngleArc) // ← arc angles
        .endAngle(endAngleArc);

      g.append("path")
        .attr("d", arc)
        .attr("fill", fillScale.getColor(pillar.color))
        .attr("fill-opacity", 0.1);

      // Lines use line angles
      [startAngleLine, endAngleLine].forEach((angle) => {
        const pos = {
          x: radialScale(100) * Math.cos(angle),
          y: radialScale(100) * Math.sin(angle),
        };

        g.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", pos.x)
          .attr("y2", pos.y)
          .attr("stroke", fillScale.getColor(pillar.color))
          .attr("stroke-width", isMobile ? 3 : 2)
          .attr("stroke-opacity", 1);
      });

      // Label uses line angles
      const midAngle = (startAngleLine + endAngleLine) / 2;
      const labelRadius = r * 1.25;
      const labelPos = {
        x: labelRadius * Math.cos(midAngle),
        y: labelRadius * Math.sin(midAngle),
      };

      const wrappedLines = wrapText(pillar.name, 18);
      const text = g
        .append("text")
        .attr("x", labelPos.x)
        .attr("y", labelPos.y)
        .attr("text-anchor", i < 2 ? "start" : "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .attr("fill", fillScale.getColor(pillar.color));

      wrappedLines.forEach((line, i) => {
        text
          .append("tspan")
          .attr("x", labelPos.x)
          .attr("dy", i === 0 ? 0 : "1.1em")
          .text(line);
      });
    });

    // Reference circles
    [100, 80, 60, 40, 20].forEach((val) => {
      g.append("circle")
        .attr("r", radialScale(val))
        .attr("fill", "#ffffff00")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.3);
    });

    // White center dot
    g.append("circle").attr("r", radialScale(3)).attr("fill", "#fff");

    // "Total" label
    g.append("text")
      // .attr("class", "label-whitestroke")
      .attr("class", "chart-axistext")
      .attr("x", 0)
      .attr("y", r * 0.65)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "currentColor")
      .text("Total");

    // Tick labels (0, 20, 40, 60, 80, 100)
    [0, 20, 40, 60, 80, 100].forEach((val) => {
      const yPos = -radialScale(val);

      g.append("text")
        // .attr("class", "label-whitestroke")
        .attr("class", "chart-axistext")
        .attr("x", 0)
        .attr("y", yPos + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "currentColor")
        .text(val);
    });
  }

  // Draw country chart
  function drawCountryChart(g, cell, r) {
    const countryData = cell.data;

    // Reference circles
    [100, 80, 60, 40, 20].forEach((val) => {
      g.append("circle")
        .attr("r", radialScale(val))
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.3);
    });

    // Total score circle (grey)
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
      .delay(cell.row * 200 + 300)
      .duration(1000)
      .ease(d3.easeQuadOut)
      .attr("r", radialScale(totalScore));

    // White center dot
    g.append("circle").attr("r", radialScale(3)).attr("fill", "#fff");

    // Group for all interactive elements (for linked brushing)
    const interactiveGroup = g
      .append("g")
      .attr("class", "interactive-elements");

    // Draw lines and dots for each commitment
    countryData.forEach((d, i) => {
      if (isNaN(d.value) || d.value === null) return;

      const angle = angleScale(d.commitment_num_cardinal - 1);
      const r = radialScale(d.value);
      const pos = polarToCartesian(angle, r);

      // wider cardinal line (from center to value)
      const lineBg = interactiveGroup
        .append("line")
        .attr(
          "class",
          `commitment-line commitment-${d.commitment_num_cardinal}`,
        )
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
        .attr("stroke", fillScale.getColor(d.pillar_txt))
        // .attr("stroke-width", isMobile ? 12 : 10)
        .attr("opacity", 0.1)
        .style("transition", "opacity 150ms");

      // Cardinal line (from center to value)
      const line = interactiveGroup
        .append("line")
        .attr(
          "class",
          `commitment-line commitment-${d.commitment_num_cardinal}`,
        )
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
        .attr("stroke", fillScale.getColor(d.pillar_txt))
        .attr("stroke-width", isMobile ? 3 : 2)
        .style("transition", "opacity 150ms");

      // Animate line drawing
      lineBg
        .transition()
        .delay(cell.row * 200 + 400 + i * 50)
        .duration(600)
        .ease(d3.easeQuadOut)
        .attr("x2", pos.x)
        .attr("y2", pos.y)
        .attr("opacity", 0.1);
      // Animate line drawing
      line
        .transition()
        .delay(cell.row * 200 + 400 + i * 50)
        .duration(600)
        .ease(d3.easeQuadOut)
        .attr("x2", pos.x)
        .attr("y2", pos.y);

      // Dot at value
      const dot = interactiveGroup
        .append("circle")
        .attr("class", `commitment-dot commitment-${d.commitment_num_cardinal}`)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", isMobile ? 6 : 4)
        .attr("fill", fillScale.getColor(d.pillar_txt))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("transition", "opacity 150ms")
        .attr("opacity", 0)
        .datum(d);

      // Animate dot appearing
      dot
        .transition()
        .delay(cell.row * 200 + 1000 + i * 50)
        .duration(300)
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("opacity", 1);

      // INVISIBLE LARGER HOVER TARGET
      interactiveGroup
        .append("circle")
        .attr(
          "class",
          `commitment-hover commitment-${d.commitment_num_cardinal}`,
        )
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", isMobile ? 12 : 10) // Much larger
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .datum(d);
    });

    // Country name at top
    const countryName = g
      .append("text")
      .attr("y", -r - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", "#000")
      .style("cursor", "pointer")
      .attr("opacity", 0)
      .text(cell.country)
      .on("click", (event, d) => {
        const iso3 = countryData[0]?.ISO3_CODE;
        if (iso3) {
          window.location.href = `${basePath}/${iso3}`;
        }
      });

    // Animate country name
    countryName
      .transition()
      .delay(cell.row * 200 + 1400)
      .duration(400)
      .attr("opacity", 1);

    // Total score label underneath
    const group = countryData[0]?.group || "";
    g.append("text")
      .attr("y", -r - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("opacity", 0)
      .text(`${Math.floor(totalScore)} (${group})`)
      .transition()
      .delay(cell.row * 200 + 1500)
      .duration(400)
      .attr("opacity", 1);
  }

  // LINKED BRUSHING
  // Get all dots and lines
  const allDots = svg.selectAll(".commitment-dot");
  const allLines = svg.selectAll(".commitment-line");
  const allHoverTargets = svg.selectAll(".commitment-hover"); // NEW for hover

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  // Hover events
  allHoverTargets
    .on("mouseenter", function (event, d) {
      const commitmentNum = d.commitment_num_cardinal;

      // Scale up all dots with same commitment number
      allDots
        .filter((dd) => dd.commitment_num_cardinal === commitmentNum)
        .transition()
        .duration(150)
        .attr("r", isMobile ? 8 : 6);

      // Dim all dots/lines except those with same commitment number
      allDots
        .transition()
        .duration(150)
        .style("opacity", (dd) =>
          dd.commitment_num_cardinal === commitmentNum ? 1 : 0.2,
        );

      allLines
        .transition()
        .duration(150)
        .style("opacity", function () {
          const classes = d3.select(this).attr("class").split(" ");
          return classes.includes(`commitment-${commitmentNum}`) ? 1 : 0.2; // Exact match
        });

      // Show tooltip
      tooltip.style("visibility", "visible").html(`
      Score: <strong>${Math.floor(d.value)}</strong><br>
      ${d.commitment_txt_cardinal}<br>
    `);
    })
    .on("mousemove", function (event) {
      // Snap to dot position
      const circle = this.getBoundingClientRect();
      const dotX = circle.left + circle.width / 2;
      const dotY = circle.top + circle.height / 2;

      tooltip
        .style("top", dotY + window.scrollY - 10 + "px")
        .style("left", dotX + window.scrollX + 10 + "px");
    })
    .on("mouseleave", function (event, d) {
      const commitmentNum = d.commitment_num_cardinal;

      // Scale down all dots with same commitment number
      allDots
        .filter((dd) => dd.commitment_num_cardinal === commitmentNum)
        .transition()
        .duration(150)
        .attr("r", isMobile ? 6 : 4);

      // Reset all to full opacity
      allDots.transition().duration(150).style("opacity", 1);
      allLines.transition().duration(150).style("opacity", 1);

      tooltip.style("visibility", "hidden");
    });

  return svg.node();
}
