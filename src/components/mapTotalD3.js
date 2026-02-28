import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import { basePath } from "./basePath.js";

/**
 * D3 Map for Total Score
 * Shows total score categories (Off track → Leading)
 *
 * @param {Array} world - GeoJSON features
 * @param {Array} coast - Coast features (optional, can be null)
 * @param {Array} dataCardinal - Cardinal pillar data (ALL YEARS for sparklines)
 * @param {Object} options - width, height
 */
export function mapTotalD3(world, coast, dataCardinal, options = {}) {
  const { width = 975, height = 610 } = options;

  // Helper: Create inline sparkline for tooltip
  function createTooltipSparkline(
    data,
    isoCode,
    pillarTxt,
    categoryColor,
    globalYearDomain,
  ) {
    const sparkW = 150;
    const sparkH = 60; // Increased for labels
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20; // Space for labels above points
    const marginBottom = 20; // Space for year labels below

    const countryData = data
      .filter((d) => d.ISO3_CODE === isoCode && d.pillar_txt === pillarTxt)
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
      .attr("stroke", categoryColor)
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
        .attr("fill", categoryColor);

      // Value label above (all points)
      svg
        .append("text")
        .attr("class", "sparkline-text")
        .attr("x", xScale(d.year))
        .attr("y", yScale(d.value) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("fill", categoryColor)
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
  const allYears = dataCardinal.map((d) => d.year).filter((y) => y != null);
  const globalYearDomain = d3.extent(allYears);

  // Get Total score rows for map coloring (filter to latest year)
  const latestYear = d3.max(dataCardinal, (d) => d.year);
  const totalScoreData = dataCardinal.filter(
    (d) => d.pillar_txt === "Total score" && d.year === latestYear,
  );

  // Merge with world
  const dataMap = new Map(totalScoreData.map((item) => [item.ISO3_CODE, item]));
  const worldWithData = world.map((feature) => {
    const matchingData = dataMap.get(feature.properties.ISO3_CODE);
    return matchingData
      ? { ...feature, properties: { ...feature.properties, ...matchingData } }
      : feature;
  });

  console.log(
    "🗺️ worldWithData sample (first 3):",
    worldWithData.slice(0, 3).map((f) => ({
      name: f.properties.NAME_ENGL,
      group_value: f.properties.group_value,
    })),
  );

  const fillScale = colorScales();

  // console.log(
  //   "🔍 check not enough data",
  //   dataCardinal.filter((d) => d.NAME_ENGL === "Iraq"),
  // );

  // Simplify cardinal data to one object per country with all pillars (latest year only)
  const simplified = {};

  // console.log("🔍 First 3 dataCardinal entries:", dataCardinal.slice(0, 3));

  const latestYearData = dataCardinal.filter((d) => d.year === latestYear);

  latestYearData.forEach((entry) => {
    const {
      ISO3_CODE,
      NAME_ENGL,
      group,
      group_value,
      total,
      pillar_txt,
      value,
      note,
      ned,
    } = entry;

    if (!simplified[ISO3_CODE]) {
      simplified[ISO3_CODE] = {
        ISO3_CODE,
        NAME_ENGL,
        group,
        group_value: null, // Will be set from Total score row
        total,
      };
    }

    // Store pillar values - including "Total score"
    simplified[ISO3_CODE][pillar_txt] = value;
    simplified[ISO3_CODE][`${pillar_txt}_note`] = note;
    simplified[ISO3_CODE][`${pillar_txt}_ned`] = ned;

    // Use group_value from "Total score" row specifically
    if (pillar_txt === "Total score") {
      simplified[ISO3_CODE].group_value = group_value;
    }
  });

  // console.log("📦 Simplified Australia:", simplified["AUS"]);

  const dataCardinalSimplified = Object.values(simplified);

  // Join cardinal data to world for centroids
  const dataCardinalMap = new Map(
    dataCardinalSimplified.map((item) => [item.ISO3_CODE, item]),
  );
  const worldWithCardinal = world.map((feature) => {
    const matchingDataCardinal = dataCardinalMap.get(
      feature.properties.ISO3_CODE,
    );
    return matchingDataCardinal
      ? {
          ...feature,
          properties: { ...feature.properties, ...matchingDataCardinal },
        }
      : feature;
  });

  // Calculate centroids of largest polygon for tooltip positioning
  function largestPolygonCentroid(feature) {
    const { type, coordinates } = feature.geometry;

    if (type === "Polygon") {
      return d3.geoCentroid(feature);
    }

    if (type === "MultiPolygon") {
      const polygons = coordinates.map((rings) => ({
        type: "Polygon",
        coordinates: rings,
      }));

      const largest = polygons.reduce((a, b) =>
        d3.geoArea(a) > d3.geoArea(b) ? a : b,
      );

      return d3.geoCentroid({ type: "Feature", geometry: largest });
    }

    return null;
  }

  const worldWithCentroids = worldWithCardinal.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      centroid: largestPolygonCentroid(f),
    },
  }));

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Projection with top margin for legend
  const marginTop = 80;
  const projection = d3
    .geoEqualEarth()
    .fitSize([width, height - marginTop], {
      type: "FeatureCollection",
      features: world,
    })
    .translate([width / 2, (height - marginTop) / 2 + marginTop]); // Shift down

  const path = d3.geoPath(projection);

  // Category colors
  const categoryColors = {
    "Off track": "#FDE74C",
    "Catching up": "#afb6b5ff",
    "On track": "#4ed0bfff",
    Leading: "#007162ff",
  };

  // Zoom behavior - only zoom with Ctrl/Cmd + scroll
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .filter((event) => {
      if (event.type === "wheel") {
        return event.ctrlKey || event.metaKey;
      }
      return true;
    })
    .on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Map group
  const mapGroup = svg.append("g").attr("class", "map-group");

  // Draw all countries (base layer)
  mapGroup
    .selectAll(".country-base")
    .data(world)
    .join("path")
    .attr("class", "country-base")
    .attr("d", path)
    .attr("fill", "#fff")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5);

  // Draw colored countries
  const countries = mapGroup
    .selectAll(".country")
    .data(worldWithData)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", (d) => {
      // Use group_value from the data
      const category = d.properties.group_value;
      if (!category || category === "NA") return "#fff";
      return categoryColors[category] || "#fff";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .style("cursor", (d) => (d.properties.ISO3_CODE ? "pointer" : "default"))
    .on("click", (event, d) => {
      if (d.properties.ISO3_CODE) {
        window.location.href = `${basePath}/${d.properties.ISO3_CODE}`;
      }
    });

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  // Add hover directly to the visible countries layer
  countries
    .on("mouseenter", function (event, d) {
      // console.log("🐭 Mouseenter on:", d.properties.NAME_ENGL);

      // Highlight this country
      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("stroke-width", 2)
        .attr("stroke", "#333");

      // Find full data from worldWithCentroids
      const fullData = worldWithCentroids.find(
        (c) => c.properties.ISO3_CODE === d.properties.ISO3_CODE,
      );

      // console.log("📊 Full data found:", fullData ? "YES" : "NO");
      // console.log("📊 Has Total score:", fullData?.properties["Total score"]);

      if (!fullData || !fullData.properties["Total score"]) {
        // console.log("❌ No data, hiding tooltip");
        tooltip.style("visibility", "hidden");
        return;
      }

      const centroid = fullData.properties.centroid;
      // console.log("📍 Centroid:", centroid);
      if (!centroid) {
        // console.log("❌ No centroid");
        return;
      }

      const transform = d3.zoomTransform(svg.node());
      const projectedCentroid = projection(centroid);
      const zoomedCentroid = [
        projectedCentroid[0] * transform.k + transform.x,
        projectedCentroid[1] * transform.k + transform.y,
      ];

      // Format pillar scores with exact structure
      const pillars = [
        "Connectivity and infrastructure",
        "Rights and freedoms",
        "Responsibility and sustainability",
        "Trust and resilience",
      ];

      const pillarScores = pillars
        .map((pillar) => {
          const value = fullData.properties[pillar];
          const ned = fullData.properties[`${pillar}_ned`];
          const note = fullData.properties[`${pillar}_note`];

          // Check for "not enough data" first
          if (ned === "not enough data") {
            return `${pillar}: Not enough data`;
          }

          // If value is "NA" string, skip it
          if (value === "NA") return null;

          // Value is a number - round it and add note
          const scoreText =
            note === "NA" ? Math.round(value) : Math.round(value) + note;
          return `${pillar}: ${scoreText}`;
        })
        .filter(Boolean)
        .join("<br>");

      // console.log("📝 Pillar scores:", pillarScores);

      const categoryDisplay =
        fullData.properties.group_value === "NA"
          ? "Not enough data"
          : fullData.properties.group_value;

      // Get color for sparkline based on category
      const categoryColor =
        fullData.properties.group_value === "NA"
          ? "#ccc"
          : categoryColors[fullData.properties.group_value] || "#ccc";

      // Generate sparkline for Total score
      const sparklineHTML = createTooltipSparkline(
        dataCardinal,
        fullData.properties.ISO3_CODE,
        "Total score",
        categoryColor,
        globalYearDomain,
      );

      const tooltipHTML = `
          <strong>${fullData.properties.NAME_ENGL}</strong> - ${categoryDisplay}<br>
          ${sparklineHTML}
          ${pillarScores}
        `;

      // console.log("🎨 Tooltip HTML:", tooltipHTML);

      tooltip.style("visibility", "visible").html(tooltipHTML);

      // console.log("👁️ Tooltip visibility:", tooltip.style("visibility"));
      // console.log("🎯 Tooltip element:", tooltip.node());

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

      // console.log(
      //   // "📍 Tooltip position - top:",
      //   tooltip.style("top"),
      //   "left:",
      //   tooltip.style("left"),
      // );
      // console.log("📍 SVG rect:", svgRect);
      // console.log("📍 Zoomed centroid:", zoomedCentroid);
    })
    .on("mouseleave", function () {
      // Reset stroke
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 0.5)
        .attr("stroke", "#fff");

      tooltip.style("visibility", "hidden");
    });

  // Zoom controls
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
    .attr("stroke", "#007162")
    .attr("stroke-width", 2);

  zoomInButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", "#007162")
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
    .attr("stroke", "#007162")
    .attr("stroke-width", 2);

  zoomOutButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", "#007162")
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
    .attr("stroke", "#007162")
    .attr("stroke-width", 2);

  resetButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 14)
    .attr("fill", "#007162")
    .text("⌂");

  // Legend - centered at top
  const legendData = [
    { label: "Off track", color: categoryColors["Off track"] },
    { label: "Catching up", color: categoryColors["Catching up"] },
    { label: "On track", color: categoryColors["On track"] },
    { label: "Leading", color: categoryColors["Leading"] },
  ];

  const legendWidth = legendData.length * 120;
  const legend = svg
    .append("g")
    .attr("class", "map-legend")
    .attr("transform", `translate(${(width - legendWidth) / 2}, 20)`);

  // White background box
  legend
    .append("rect")
    .attr("class", "legend-background")
    .attr("x", -20)
    .attr("y", -20)
    .attr("width", legendWidth + 40)
    .attr("height", 60)
    .attr("fill", "#ffffff00")
    // .attr("stroke", "#ddd")
    // .attr("stroke-width", 1)
    .attr("rx", 4);

  const legendItems = legend
    .selectAll(".legend-item")
    .data(legendData)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${i * 120}, 0)`);

  legendItems
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => d.color);

  legendItems
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .text((d) => d.label);

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
        overlayDiv.style.display = "flex";
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(() => {
          overlayDiv.style.display = "none";
        }, 1200);
      }
    },
    { passive: true },
  );

  return container;
}
