import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import { renderPillarContent } from "./pillarRenderer.js";

// Create a custom legend component that can be used instead of radio buttons
export function customLegend(
  uniqueValues,
  initialValue,
  onChange,
  legendId,
  fill
) {
  const fillScale = colorScales();
  const container = document.createElement("div");
  container.className = "custom-legend";

  // ðŸ‘‡ Apply unique ID if provided
  if (legendId) container.id = `custom-legend-${legendId}`;

  const selectedValue = { value: initialValue };

  uniqueValues.forEach((value) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.value = value;
    item.textContent = value;

    // ðŸ‘‡ Conditional backgroundColor logic
    const backgroundColor = fill
      ? fillScale.getColor(fill, 100)
      : fillScale.getColor(value, 100);

    item.style.backgroundColor = backgroundColor;

    const rgb = d3.rgb(backgroundColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    item.style.color = brightness < 128 ? "white" : "black";

    if (value === selectedValue.value) {
      item.classList.add("selected");
    }

    item.addEventListener("click", () => {
      selectedValue.value = value;
      container.querySelectorAll(".legend-item").forEach((el) => {
        el.classList.toggle("selected", el.dataset.value === value);
      });

      if (onChange) onChange(value);

      // ðŸ‘‡ Use unique content container for this legend
      if (legendId) {
        renderPillarContent(value, `#pillar-content-${legendId}`);
      }
    });

    container.appendChild(item);
  });

  container.value = initialValue;

  return container;
}

// Also provide a viewof function to make it work with Observable's reactivity
export function viewofCustomLegend(uniqueValues, initialValue, legendId, fill) {
  const selectedValue = { value: initialValue || uniqueValues[0] };

  const view = customLegend(
    uniqueValues,
    selectedValue.value,
    (value) => {
      selectedValue.value = value;
      view.value = value;
      view.dispatchEvent(new Event("input")); // Observable-style reactivity
    },
    legendId,
    fill // ðŸ‘ˆ pass fill parameter to customLegend
  );

  Object.defineProperty(view, "value", {
    get: () => selectedValue.value,
    set: (value) => {
      selectedValue.value = value;
      view.querySelectorAll(".legend-item").forEach((el) => {
        el.classList.toggle("selected", el.dataset.value === value);
      });
    },
  });

  return view;
}
