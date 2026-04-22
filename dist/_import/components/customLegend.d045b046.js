import * as d3 from "../../_npm/d3@7.9.0/e324157d.js";
import colorScales from "./scales.3650d4d9.js";
import { renderPillarContent } from "./pillarRenderer.5b2606d3.js";

// Create a custom legend component that can be used instead of radio buttons
export function customLegend(
  uniqueValues,
  initialValue,
  onChange,
  legendId,
  fill,
) {
  const fillScale = colorScales();
  const container = document.createElement("div");
  container.className = "custom-legend";

  // Apply unique ID if provided
  if (legendId) container.id = `custom-legend-${legendId}`;

  const selectedValue = { value: initialValue };

  uniqueValues.forEach((value) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.dataset.value = value;
    item.textContent = value;

    // Get the full color for this value
    const fullColor = fill
      ? fillScale.getColor(fill, 100)
      : fillScale.getColor(value, 100);

    // Parse RGB values
    const rgb = d3.rgb(fullColor);

    // ALWAYS set these attributes for use in click handler
    item.dataset.fullColor = fullColor;
    item.dataset.r = Math.round(rgb.r);
    item.dataset.g = Math.round(rgb.g);
    item.dataset.b = Math.round(rgb.b);

    // Set initial styling based on selection state
    const isInitiallySelected = value === selectedValue.value;

    if (isInitiallySelected) {
      item.classList.add("selected");
      item.style.backgroundColor = fullColor;
      item.style.color = "white";
    } else {
      item.style.backgroundColor = `rgba(${item.dataset.r}, ${item.dataset.g}, ${item.dataset.b}, 0.1)`;
      item.style.color = fullColor;
    }

    item.addEventListener("click", () => {
      selectedValue.value = value;

      // Update ALL items - this is key!
      container.querySelectorAll(".legend-item").forEach((el) => {
        const isSelected = el.dataset.value === value;
        el.classList.toggle("selected", isSelected);

        // Update inline styles for each item
        const elColor = el.dataset.fullColor;
        const r = el.dataset.r;
        const g = el.dataset.g;
        const b = el.dataset.b;

        if (isSelected) {
          el.style.backgroundColor = elColor;
          el.style.color = "white";
        } else {
          el.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
          el.style.color = elColor;
        }
      });

      if (onChange) onChange(value);

      // Use unique content container for this legend
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
    fill,
  );

  Object.defineProperty(view, "value", {
    get: () => selectedValue.value,
    set: (value) => {
      selectedValue.value = value;

      // Update ALL items when value is set programmatically
      view.querySelectorAll(".legend-item").forEach((el) => {
        const isSelected = el.dataset.value === value;
        el.classList.toggle("selected", isSelected);

        const elColor = el.dataset.fullColor;
        const r = el.dataset.r;
        const g = el.dataset.g;
        const b = el.dataset.b;

        if (isSelected) {
          el.style.backgroundColor = elColor;
          el.style.color = "white";
        } else {
          el.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
          el.style.color = elColor;
        }
      });
    },
  });

  return view;
}
