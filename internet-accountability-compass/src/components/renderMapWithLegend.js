import { mapPillar } from "./mapPillar.js";
import { viewofCustomLegend } from "./customLegend.js";

// This wraps the custom legend + the map together
export function renderMapWithLegend(world, data, property, uniqueValues, size) {
  const container = document.createElement("div");
  container.className = "map-with-legend";

  const mapWrapper = document.createElement("div");
  container.appendChild(mapWrapper);

  const initialPillar = uniqueValues[0]; // e.g., "Rights and freedoms", etc.

  // Create the legend (selects the pillar)
  const legend = viewofCustomLegend(uniqueValues, initialPillar);

  console.log("legend.value", legend.value);

  function drawMap(selectedPillar) {
    const plot = mapPillar(
      world,
      data,
      property,
      uniqueValues,
      selectedPillar,
      size
    );
    mapWrapper.innerHTML = ""; // clear old plot
    mapWrapper.appendChild(plot);
  }

  // Initial draw
  drawMap(initialPillar);

  // Redraw on legend change
  legend.addEventListener("input", () => {
    drawMap(legend.value);
  });

  container.prepend(legend);
  return container;
}
