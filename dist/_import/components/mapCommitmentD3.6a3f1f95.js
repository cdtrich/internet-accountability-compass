import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";

/**
 * D3 Map for Commitment-level data
 * Shows score gradient (0-100) for selected commitment
 *
 * @param {Array} world - GeoJSON features
 * @param {Array} data - Data filtered to one pillar with commitment_txt_cardinal, value (ALL YEARS)
 * @param {string} selectedPillar - Selected pillar (for coloring)
 * @param {string} selectedCommitment - Selected commitment to display
 * @param {Object} options - width, height
 */
export function mapCommitmentD3(
  world,
  data,
  selectedPillar,
  selectedCommitment,
  options = {},
) {
  const { width = 975, height = 610 } = options;

  const fillScale = colorScales();
  const pillarColor = fillScale.getColor(selectedPillar);

  // Helper: Create inline sparkline for tooltip
  function createTooltipSparkline(
    data,
    isoCode,
    commitment,
    color,
    globalYearDomain,
  ) {
    const sparkW = 150;
    const sparkH = 60; // Increased for labels
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20; // Space for labels above points
    const marginBottom = 20; // Space for year labels below

    const countryData = data
      .filter(
        (d) =>
          d.ISO3_CODE === isoCode && d.commitment_txt_cardinal === commitment,
      )
      .filter((d) => d.value !== null && d.value !== "NA" && !isNaN(d.value))
      .sort((a, b) => a.year - b.year);

    if (countryData.length === 0) return "";

    // Use global year domain for consistent x-axis
    const xScale = d3
      .scaleLinear()
      .domain(globalYearDomain)
      .range([marginLeft, sparkW - marginRight]);
    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([sparkH - marginBottom, marginTop]);

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))
      .curve(d3.curveCatmullRom);

    const svg = d3
      .create("svg")
      .attr("width", sparkW)
      .attr("height", sparkH)
      .attr("viewBox", [0, 0, sparkW, sparkH])
      .style("display", "block")
      .style("margin", "4px 0");

    // Line
    svg
      .append("path")
      .datum(countryData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2);

    // Dots with labels
    countryData.forEach((d, i) => {
      const isFirst = i === 0;
      const isLast = i === countryData.length - 1;

      svg
        .append("circle")
        .attr("cx", xScale(d.year))
        .attr("cy", yScale(d.value))
        .attr("r", 3)
        .attr("fill", color);

      // Value label above (all points)
      svg
        .append("text")
        .attr("class", "sparkline-text")
        .attr("x", xScale(d.year))
        .attr("y", yScale(d.value) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("fill", color)
        .text(`${Math.round(d.value)}`);

      // Year label below (only first and last)
      if (isFirst || isLast) {
        const shortYear = `'${String(d.year).slice(-2)}`;
        svg
          .append("text")
          .attr("class", "sparkline-text")
          .attr("x", xScale(d.year))
          .attr("y", sparkH - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .attr("fill", "#333")
          .text(shortYear);
      }
    });

    return svg.node().outerHTML;
  }

  // Calculate global year domain for consistent sparkline x-axis
  const allYears = data.map((d) => d.year).filter((y) => y != null);
  const globalYearDomain = d3.extent(allYears);

  // Filter data by selected commitment AND exclude Total score (latest year only for map)
  const latestYear = d3.max(data, (d) => d.year);
  const filteredData = data.filter(
    (d) =>
      d.commitment_txt_cardinal === selectedCommitment &&
      d.pillar_txt !== "Total score" &&
      d.year === latestYear,
  );

  // Merge world data with filtered data
  const dataMap = new Map(filteredData.map((item) => [item.ISO3_CODE, item]));
  const worldWithData = world.map((feature) => {
    const matchingData = dataMap.get(feature.properties.ISO3_CODE);
    return matchingData
      ? { ...feature, properties: { ...feature.properties, ...matchingData } }
      : feature;
  });

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Projection
  const projection = d3
    .geoEqualEarth()
    .fitSize([width, height], { type: "FeatureCollection", features: world });

  const path = d3.geoPath(projection);

  // Color scale - gradient from light to pillar color
  const colorScale = d3
    .scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolate("#f0f0f0", pillarColor));

  // Zoom behavior - only zoom with Ctrl/Cmd + scroll
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .filter((event) => {
      // Allow zoom with Ctrl/Cmd + wheel, or with buttons/touch
      if (event.type === "wheel") {
        return event.ctrlKey || event.metaKey;
      }
      return true; // Allow all other zoom triggers (drag, touch)
    })
    .on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Map group
  const mapGroup = svg.append("g").attr("class", "map-group");

  // Draw countries
  const countries = mapGroup
    .selectAll(".country")
    .data(worldWithData)
    .join("path")
    .attr("d", path)
    .attr("fill", (d) => {
      if (isNaN(d.properties.value)) return "#fff";
      return colorScale(d.properties.value);
    })
    .attr("stroke", (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"))
    .attr("stroke-width", 0.5)
    .style("cursor", (d) => (d.properties.ISO3_CODE ? "pointer" : "default"))
    .on("click", (event, d) => {
      if (d.properties.ISO3_CODE) {
        window.location.href = `/${d.properties.ISO3_CODE}`;
      }
    });

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  // Hover behavior - snap to centroid
  // Hover behavior - snap to centroid
  countries
    .on("mouseenter", function (event, d) {
      // Raise to top and highlight stroke
      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("stroke-width", 2)
        .attr("stroke", "#333");

      const centroid = path.centroid(d);
      const transform = d3.zoomTransform(svg.node());

      // Apply zoom transform to centroid
      const zoomedCentroid = [
        centroid[0] * transform.k + transform.x,
        centroid[1] * transform.k + transform.y,
      ];

      // Check if data is available
      const hasData = !isNaN(d.properties.value);
      const partialNote =
        d.properties.note === " (partial data)" ? " (partial data)" : "";

      // Generate sparkline using pillar color
      const sparklineHTML = hasData
        ? createTooltipSparkline(
            data,
            d.properties.ISO3_CODE,
            selectedCommitment,
            pillarColor,
            globalYearDomain,
          )
        : "";

      const tooltipContent = hasData
        ? `<strong>${d.properties.NAME_ENGL}</strong> - ${d.properties.group_value}<br>
        Score: ${Math.round(d.properties.value)}${partialNote}
        ${sparklineHTML}`
        : `<strong>${d.properties.NAME_ENGL}</strong><br>
           Not enough data`;

      tooltip.style("visibility", "visible").html(tooltipContent);

      // Position at centroid
      const svgRect = svg.node().getBoundingClientRect();
      tooltip
        .style(
          "top",
          svgRect.top + zoomedCentroid[1] + window.scrollY - 10 + "px",
        )
        .style(
          "left",
          svgRect.left + zoomedCentroid[0] + window.scrollX + 10 + "px",
        );
    })
    .on("mouseleave", function () {
      // Reset stroke
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 0.5)
        .attr("stroke", (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"));

      tooltip.style("visibility", "hidden");
    });

  // Zoom controls (matching mapPillar position)
  const controlsGroup = svg
    .append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width - 50}, ${height - 200})`);

  // Zoom in button
  const zoomInButton = controlsGroup
    .append("g")
    .attr("class", "zoom-button")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    });

  zoomInButton
    .append("circle")
    .attr("r", 20)
    .attr("fill", "white")
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2);

  zoomInButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", pillarColor)
    .attr("font-weight", "bold")
    .text("+");

  // Zoom out button
  const zoomOutButton = controlsGroup
    .append("g")
    .attr("class", "zoom-button")
    .attr("transform", "translate(0, 50)")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.67);
    });

  zoomOutButton
    .append("circle")
    .attr("r", 20)
    .attr("fill", "white")
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2);

  zoomOutButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", pillarColor)
    .attr("font-weight", "bold")
    .text("−");

  // Reset zoom button
  const resetButton = controlsGroup
    .append("g")
    .attr("class", "zoom-button")
    .attr("transform", "translate(0, 100)")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });

  resetButton
    .append("circle")
    .attr("r", 20)
    .attr("fill", "white")
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2);

  resetButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 14)
    .attr("fill", pillarColor)
    .text("⌂");

  // Gradient legend (matching mapPillar position)
  const legendWidth = 200;
  const legendHeight = 15;

  const legend = svg
    .append("g")
    .attr("class", "map-legend")
    .attr("transform", `translate(100, ${height / 2})`);

  // Add white background box
  const legendBg = legend
    .append("rect")
    .attr("class", "legend-background")
    .attr("x", -20)
    .attr("y", -25)
    .attr("width", legendWidth + 40) // 200 + 40 = 240
    .attr("height", 75) // Gradient + labels + title + padding
    .attr("fill", "#ffffff80")
    // .attr("stroke", "#ddd")
    // .attr("stroke-width", 1)
    .attr("rx", 4); // Rounded corners

  // Create gradient
  const gradientId = `gradient-${selectedPillar.replace(/\s+/g, "-")}`;
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%");

  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#f0f0f0");

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", pillarColor);

  // Gradient rect
  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", `url(#${gradientId})`)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);

  // Legend labels
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", legendHeight + 15)
    .attr("font-size", 12)
    .text("0");

  legend
    .append("text")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 15)
    .attr("text-anchor", "end")
    .attr("font-size", 12)
    .text("100");

  legend
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .text("Score");

  // Scroll hint overlay
  const overlayDiv = document.createElement("div");
  overlayDiv.className = "map-scroll-overlay";
  overlayDiv.innerHTML = `
    <div class="map-scroll-message">
      <span>Use ${navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + scroll to zoom</span>
    </div>
  `;
  overlayDiv.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 10;
  `;

  const messageDiv = overlayDiv.querySelector(".map-scroll-message");
  messageDiv.style.cssText = `
    background: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 600;
    color: #333;
  `;

  // Wrap SVG in container
  const container = document.createElement("div");
  container.style.position = "relative";
  container.appendChild(svg.node());
  container.appendChild(overlayDiv);

  let overlayTimeout;

  // Show overlay on scroll without Ctrl/Cmd
  svg.on(
    "wheel",
    function (event) {
      if (!event.ctrlKey && !event.metaKey) {
        // Show overlay briefly (page will scroll normally)
        overlayDiv.style.display = "flex";
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(() => {
          overlayDiv.style.display = "none";
        }, 1200);
      }
    },
    { passive: true },
  ); // passive listener - doesn't block scrolling

  return container;
}
