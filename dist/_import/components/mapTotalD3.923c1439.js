import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";
import { basePath } from "./basePath.f3174b65.js";

/**
 * D3 Map for Total Score
 * Shows total score categories (Off track → Leading) or year-over-year change
 *
 * @param {Array} world - GeoJSON features
 * @param {Array} coast - Coast features (optional, can be null)
 * @param {Array} dataCardinal - Cardinal pillar data (ALL YEARS for sparklines)
 * @param {Object} options - width, height, mode ("latest" or "historical")
 */
export function mapTotalD3(world, coast, dataCardinal, options = {}) {
  const { width = 975, height = 610, mode = "latest" } = options;

  // Helper: Create inline sparkline for tooltip with color-coded dots
  function createTooltipSparkline(
    data,
    isoCode,
    pillarTxt,
    categoryColors,
    globalYearDomain,
  ) {
    const sparkW = 150;
    const sparkH = 60;
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 0;
    const marginBottom = 20;

    const countryData = data
      .filter((d) => d.ISO3_CODE === isoCode && d.pillar_txt === pillarTxt)
      .filter((d) => d.value !== null && d.value !== "NA" && !isNaN(d.value))
      .sort((a, b) => a.year - b.year);

    if (countryData.length === 0) return "";

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

    const area = d3
      .area()
      .x((d) => xScale(d.year))
      .y0(sparkH - marginBottom)
      .y1((d) => yScale(d.value))
      .curve(d3.curveCatmullRom);

    const svg = d3
      .create("svg")
      .attr("width", sparkW)
      .attr("height", sparkH)
      .attr("viewBox", [0, 0, sparkW, sparkH])
      .style("display", "block")
      .style("margin", "4px 0");

    // Area
    svg
      .append("path")
      .datum(countryData)
      .attr("d", area)
      .attr("fill", "#ccc")
      .attr("fill-opacity", 0.5)
      .attr("stroke", "none");

    // Line
    // svg
    //   .append("path")
    //   .datum(countryData)
    //   .attr("d", line)
    //   .attr("fill", "none")
    //   .attr("stroke", "#000")
    //   .attr("stroke-width", 0.5);

    // Dots with labels - colored by their year's category
    countryData.forEach((d, i) => {
      const isFirst = i === 0;
      const isLast = i === countryData.length - 1;

      // Get color for this year's category
      const dotColor =
        d.group_value === "NA"
          ? "#ccc"
          : categoryColors[d.group_value] || "#ccc";

      svg
        .append("circle")
        .attr("cx", xScale(d.year))
        .attr("cy", yScale(d.value))
        .attr("r", 3)
        .attr("stroke", "#fff")
        .attr("fill", dotColor);

      // Value label above (all points) - colored by category
      svg
        .append("text")
        .attr("class", "sparkline-text")
        .attr("x", xScale(d.year))
        .attr("y", yScale(d.value) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .attr("fill", dotColor)
        // .attr("fill", "#000")
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

  // Get latest and previous year
  const latestYear = d3.max(dataCardinal, (d) => d.year);
  const previousYear = latestYear - 1;

  // Category colors
  const categoryColors = {
    "Off track": "#FDE74C",
    "Catching up": "#afb6b5ff",
    "On track": "#4ed0bfff",
    Leading: "#007162ff",
  };

  // Historical mode: Simple colors + opacity for magnitude
  const changeColors = {
    positive: "#007162ff", // Green for improvements
    negative: "#FDE74C", // Yellow for declines
    zero: "#fff", // Gray for no change
  };

  // Opacity scale based on absolute change magnitude
  // 0 change → 0 opacity, 20+ change → 1 opacity
  const opacityScale = d3
    .scaleLinear()
    .domain([0, 20])
    .range([0, 1])
    .clamp(true);

  let worldWithData, legendData;

  if (mode === "historical") {
    // Historical mode: show year-over-year change
    const latestData = dataCardinal.filter(
      (d) => d.pillar_txt === "Total score" && d.year === latestYear,
    );
    const previousData = dataCardinal.filter(
      (d) => d.pillar_txt === "Total score" && d.year === previousYear,
    );

    const previousMap = new Map(
      previousData.map((item) => [item.ISO3_CODE, item.value]),
    );

    // Calculate changes
    const changesData = latestData.map((current) => {
      const prevValue = previousMap.get(current.ISO3_CODE);
      const change =
        prevValue && current.value !== "NA" && prevValue !== "NA"
          ? current.value - prevValue
          : null;

      return {
        ...current,
        change,
        previousValue: prevValue,
      };
    });

    const dataMap = new Map(changesData.map((item) => [item.ISO3_CODE, item]));
    worldWithData = world.map((feature) => {
      const matchingData = dataMap.get(feature.properties.ISO3_CODE);
      return matchingData
        ? { ...feature, properties: { ...feature.properties, ...matchingData } }
        : feature;
    });

    legendData = [
      { label: "Decrease", color: changeColors.negative },
      { label: "No change", color: changeColors.zero },
      { label: "Increase", color: changeColors.positive },
      {
        label: "Not enough data",
        color: "url(#ned-hatch)",
        stroke: "#ddd",
        strokeWidth: 0.5,
      },
    ];
  } else {
    // Latest mode: show current categories
    const totalScoreData = dataCardinal.filter(
      (d) => d.pillar_txt === "Total score" && d.year === latestYear,
    );

    const dataMap = new Map(
      totalScoreData.map((item) => [item.ISO3_CODE, item]),
    );
    worldWithData = world.map((feature) => {
      const matchingData = dataMap.get(feature.properties.ISO3_CODE);
      return matchingData
        ? { ...feature, properties: { ...feature.properties, ...matchingData } }
        : feature;
    });

    legendData = [
      // { label: "Off track", color: categoryColors["Off track"] },
      // { label: "Catching up", color: categoryColors["Catching up"] },
      // { label: "On track", color: categoryColors["On track"] },
      // { label: "Leading", color: categoryColors["Leading"] },
      {
        label: "Not enough data",
        color: "url(#ned-hatch)",
        stroke: "#ddd",
        strokeWidth: 0.5,
      },
    ];
  }

  // Simplify cardinal data for tooltips
  const simplified = {};
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
        group_value: null,
        total,
      };
    }

    simplified[ISO3_CODE][pillar_txt] = value;
    simplified[ISO3_CODE][`${pillar_txt}_note`] = note;
    simplified[ISO3_CODE][`${pillar_txt}_ned`] = ned;

    if (pillar_txt === "Total score") {
      simplified[ISO3_CODE].group_value = group_value;
    }
  });

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

  // Calculate centroids
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

  // Pattern for "not enough data" countries
  const defs = svg.append("defs");
  const nedPattern = defs
    .append("pattern")
    .attr("id", "ned-hatch")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 4.2425)
    .attr("height", 4.2425)
    .attr("patternTransform", "rotate(45)");
  nedPattern
    .append("rect")
    .attr("width", 4.2425)
    .attr("height", 4.2425)
    .attr("fill", "#fff");
  nedPattern
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1.5)
    .attr("height", 4.2425)
    .attr("fill", "#ddd");

  // Projection
  const marginTop = 80;
  const projection = d3
    .geoEqualEarth()
    .fitSize([width, height - marginTop], {
      type: "FeatureCollection",
      features: world,
    })
    .translate([width / 2, (height - marginTop) / 2 + marginTop]);

  const path = d3.geoPath(projection);

  // Zoom behavior
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

  const mapGroup = svg.append("g").attr("class", "map-group");

  // Helper: check if country has data in current mode
  const hasData = (d) => {
    if (mode === "historical") {
      return d.properties.change !== null && d.properties.change !== undefined;
    }
    return d.properties.group_value && d.properties.group_value !== "NA";
  };

  // Draw all countries (base layer)
  // - With data: white fill, light gray stroke (will be covered by data layer)
  // - Without data: coastline style (no fill, dark gray stroke)
  mapGroup
    .selectAll(".country-base")
    .data(worldWithData)
    .join("path")
    .attr("class", "country-base")
    .attr("d", path)
    .attr("fill", (d) => (hasData(d) ? "#fff" : "url(#ned-hatch)"))
    .attr("stroke", "#ddd")
    .attr("stroke-width", 0.5)
    .attr("pointer-events", "all");

  // Draw countries with data (colored layer)
  mapGroup
    .selectAll(".country-data")
    .data(
      worldWithData.filter((d) => {
        if (mode === "historical") {
          return d.properties.change !== null;
        }
        return d.properties.group_value && d.properties.group_value !== "NA";
      }),
    )
    .join("path")
    .attr("class", "country-data")
    .attr("d", path)
    .attr("fill", (d) => {
      if (mode === "historical") {
        const change = d.properties.change;
        if (change > 0) return changeColors.positive;
        if (change < 0) return changeColors.negative;
        return changeColors.zero;
      }
      return categoryColors[d.properties.group_value] || "#fff";
    })
    .attr("fill-opacity", (d) => {
      if (mode === "historical") {
        return opacityScale(Math.abs(d.properties.change));
      }
      return 1;
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

  // Draw coast if provided
  if (coast) {
    mapGroup
      .append("path")
      .datum(coast)
      .attr("class", "coast")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.3);
  }

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "map-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("padding", "12px")
    .style("border-radius", "8px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
    .style("pointer-events", "none")
    .style("font-family", "sans-serif")
    .style("font-size", "14px")
    .style("line-height", "1.6")
    .style("max-width", "300px")
    .style("z-index", "1000");

  // Hover interactions
  mapGroup
    .selectAll(".country-data")
    .on("click", function (event, d) {
      const iso3 = d.properties.ISO3_CODE;
      if (iso3) window.location.href = `${basePath}/${iso3}/`;
    })
    .style("cursor", "pointer")
    .on("mouseenter", function (event, d) {
      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("stroke-width", 1)
        .attr("stroke", "#333");

      const fullData = worldWithCentroids.find(
        (f) => f.properties.ISO3_CODE === d.properties.ISO3_CODE,
      );

      if (!fullData) return;

      const centroid = fullData.properties.centroid;
      if (!centroid) return;

      const transform = d3.zoomTransform(svg.node());
      const projectedCentroid = projection(centroid);
      const zoomedCentroid = [
        projectedCentroid[0] * transform.k + transform.x,
        projectedCentroid[1] * transform.k + transform.y,
      ];

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

          if (ned === "not enough data") {
            return `${pillar}: Not enough data`;
          }

          if (value === "NA") return null;

          const scoreText =
            note === "NA" ? Math.round(value) : Math.round(value) + note;
          return `${pillar}: ${scoreText}`;
        })
        .filter(Boolean)
        .join("<br>");

      // Generate sparkline
      const sparklineHTML = createTooltipSparkline(
        dataCardinal,
        fullData.properties.ISO3_CODE,
        "Total score",
        categoryColors,
        globalYearDomain,
      );

      let tooltipHTML;
      if (mode === "historical") {
        const change = d.properties.change;
        const changeSign = change > 0 ? "+" : "";
        let changeColor;
        if (change > 0) changeColor = changeColors.positive;
        else if (change < 0) changeColor = changeColors.negative;
        else changeColor = changeColors.zero;

        tooltipHTML = `
          <strong style="font-size: 28px; font-weight: bold; color: ${changeColor}; margin-bottom: 8px;">
            ${changeSign}${Math.round(change)}
          </strong><strong>${fullData.properties.NAME_ENGL}</strong><br>
          <span style="font-size: 11px; color: #666;"><strong>${Math.round(d.properties.value)}</strong> (${latestYear})<br>
          <strong>${Math.round(d.properties.previousValue)}</strong> (${previousYear})</span>
        `;
      } else {
        const categoryDisplay =
          fullData.properties.group_value === "NA"
            ? "Not enough data"
            : fullData.properties.group_value;

        const categoryColor =
          fullData.properties.group_value === "NA"
            ? "#ccc"
            : categoryColors[fullData.properties.group_value] || "#ccc";

        const totalScore =
          fullData.properties["Total score"] || fullData.properties.total || 0;

        tooltipHTML = `
          <strong style="font-size: 42px; font-weight: bold; color: ${categoryColor}; margin-bottom: 8px;">
            ${Math.round(totalScore)}
          </strong>
          <strong>${fullData.properties.NAME_ENGL}</strong> (${categoryDisplay})<br>
          ${sparklineHTML}
          ${pillarScores}
        `;
      }

      tooltip.style("visibility", "visible").html(tooltipHTML);

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
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 0.5)
        .attr("stroke", "#ddd");

      tooltip.style("visibility", "hidden");
    });

  // Hover interactions for countries WITHOUT data (base layer)
  mapGroup
    .selectAll(".country-base")
    .filter((d) => !hasData(d))
    .style("cursor", "pointer")
    .on("click", function (_event, d) {
      const iso3 = d.properties.ISO3_CODE;
      if (iso3) window.location.href = `${basePath}/${iso3}/`;
    })
    .on("mouseenter", function (event, d) {
      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("stroke-width", 1)
        .attr("stroke", "#333");

      const fullData = worldWithCentroids.find(
        (f) => f.properties.ISO3_CODE === d.properties.ISO3_CODE,
      );

      if (!fullData) return;

      const centroid = fullData.properties.centroid;
      if (!centroid) return;

      const transform = d3.zoomTransform(svg.node());
      const projectedCentroid = projection(centroid);
      const zoomedCentroid = [
        projectedCentroid[0] * transform.k + transform.x,
        projectedCentroid[1] * transform.k + transform.y,
      ];

      const tooltipHTML = `
        <strong>${d.properties.NAME_ENGL}</strong><br>
        <span style="font-size: 11px; color: #666;">Not enough data</span>
      `;

      tooltip.style("visibility", "visible").html(tooltipHTML);

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
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 0.5)
        .attr("stroke", "#ddd");

      tooltip.style("visibility", "hidden");
    });

  // Zoom controls
  const controlsGroup = svg
    .append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width - 50}, ${height - 200})`);

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

  // Legend
  const legend = svg
    .append("g")
    .attr("class", "map-legend")
    .attr("transform", `translate(100, ${height / 2})`);

  legend
    .append("rect")
    .attr("class", "legend-background")
    .attr("x", -20)
    .attr("y", -20)
    .attr("width", 300)
    .attr("height", legendData.length * 25 + 40)
    .attr("fill", "#ffffff80")
    .attr("rx", 4);

  const legendItems = legend
    .selectAll(".legend-item")
    .data(legendData)
    .join("g")
    .attr("class", "legend-item")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .attr("transform", (_d, i) => `translate(0, ${i * 25})`);

  legendItems
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => d.color)
    .attr("stroke", (d) => d.stroke || "none")
    .attr("stroke-width", (d) => d.strokeWidth || 0);

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
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    display: none;
    pointer-events: none;
    z-index: 10;
  `;

  const messageDiv = overlayDiv.querySelector(".map-scroll-message");
  messageDiv.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 16px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 12px;
    font-weight: 500;
    color: #666;
    border: 1px solid #ddd;
  `;

  const container = document.createElement("div");
  container.style.position = "relative";
  container.appendChild(svg.node());
  container.appendChild(overlayDiv);

  let overlayTimeout;

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
