import * as Plot from "npm:@observablehq/plot";

/**
 * Sparkline Component
 * Creates small inline trend charts for showing historical data
 * 
 * @param {Array} data - Full dataset with year column
 * @param {string} country - Country name to filter by
 * @param {string} metric - Which metric to plot (default: "total")
 * @param {Object} options - Chart options (width, height, colors)
 * @returns {SVGElement} Plot sparkline chart
 */
export function sparkline(data, country, metric = "total", options = {}) {
  const {
    width = 120,
    height = 30,
    strokeColor = "#007162",
    strokeWidth = 2,
    dotRadius = 2.5,
    showDots = true
  } = options;

  // Filter data for this country and sort by year
  const countryData = data
    .filter(d => d.NAME_ENGL === country)
    .sort((a, b) => a.year - b.year);

  // If no data, return empty
  if (countryData.length === 0) {
    return html`<div style="width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px;">No data</div>`;
  }

  return Plot.plot({
    width,
    height,
    axis: null,
    margin: 0,
    x: { domain: [2020, 2025] },
    y: { domain: [0, 100] },
    marks: [
      // Background area (optional, subtle)
      Plot.areaY(countryData, {
        x: "year",
        y: metric,
        fill: strokeColor,
        fillOpacity: 0.1,
        curve: "catmull-rom"
      }),
      // Line
      Plot.line(countryData, {
        x: "year",
        y: metric,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        curve: "catmull-rom"
      }),
      // Dots
      ...(showDots
        ? [
            Plot.dot(countryData, {
              x: "year",
              y: metric,
              fill: strokeColor,
              r: dotRadius
            })
          ]
        : [])
    ]
  });
}

/**
 * Sparkline with Pillar Colors
 * Creates a sparkline colored by the pillar
 * 
 * @param {Array} data - Dataset filtered to one country and pillar
 * @param {Object} colorScale - Color scale object { domain: [...], range: [...] }
 * @param {Object} options - Chart options
 */
export function sparklinePillar(data, pillar, colorScale, options = {}) {
  const { width = 100, height = 25 } = options;

  const pillarData = data
    .filter(d => d.pillar_txt === pillar)
    .sort((a, b) => a.year - b.year);

  if (pillarData.length === 0) {
    return html`<div style="width: ${width}px; height: ${height}px;"></div>`;
  }

  // Get color for this pillar
  const color = colorScale.range[colorScale.domain.indexOf(pillar)] || "#666";

  return Plot.plot({
    width,
    height,
    axis: null,
    margin: 0,
    x: { domain: [2020, 2025] },
    y: { domain: [0, 100] },
    marks: [
      Plot.line(pillarData, {
        x: "year",
        y: "value",
        stroke: color,
        strokeWidth: 1.5,
        curve: "catmull-rom"
      }),
      Plot.dot(pillarData, {
        x: "year",
        y: "value",
        fill: color,
        r: 2
      })
    ]
  });
}

/**
 * Multi-Sparkline Grid
 * Shows sparklines for all pillars for a given country
 * 
 * @param {Array} data - Full dataset
 * @param {string} country - Country name
 * @param {Array} pillars - Array of pillar names
 * @param {Object} colorScale - Color scale
 */
export function sparklineGrid(data, country, pillars, colorScale) {
  const countryData = data.filter(d => d.NAME_ENGL === country);

  return html`
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
      ${pillars.map(
        (pillar) => html`
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-size: 11px; color: #666; flex: 1;">${pillar}</div>
            ${sparklinePillar(countryData, pillar, colorScale, {
              width: 80,
              height: 20
            })}
          </div>
        `
      )}
    </div>
  `;
}
