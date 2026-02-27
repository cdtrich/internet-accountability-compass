import * as Inputs from "npm:@observablehq/inputs";

/**
 * Historical Toggle Component
 * Creates a simple Latest/Historical view toggle
 * 
 * Usage in markdown:
 * ```js
 * import { historicalToggle } from "./components/historicalToggle.js";
 * const viewMode = view(historicalToggle());
 * ```
 * 
 * Then use viewMode to filter data:
 * - viewMode === "latest" → filter to year 2025
 * - viewMode === "historical" → show all years or create trend viz
 */

export function historicalToggle(options = {}) {
  const {
    initialValue = "latest",
    label = "View:",
  } = options;

  return Inputs.radio(
    ["latest", "historical"],
    {
      value: initialValue,
      label: label,
      format: (x) => x === "latest" ? "📅 Latest (2025)" : "📊 Historical (2020-2025)"
    }
  );
}

/**
 * Helper function to filter data based on view mode
 * 
 * @param {Array} data - Full dataset with year column
 * @param {string} viewMode - "latest" or "historical"
 * @param {number} latestYear - The most recent year (default: 2025)
 * @returns {Array} Filtered data
 */
export function filterByViewMode(data, viewMode, latestYear = 2025) {
  if (viewMode === "latest") {
    return data.filter(d => d.year === latestYear);
  }
  return data; // Return all years for historical view
}

/**
 * Get unique years from dataset
 * 
 * @param {Array} data - Dataset with year column
 * @returns {Array} Sorted array of unique years
 */
export function getYears(data) {
  return [...new Set(data.map(d => d.year))].sort();
}
