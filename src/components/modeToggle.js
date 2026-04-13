/**
 * Mode Toggle (Latest/Historical)
 * Styled like customLegend with gray colors for selected/unselected states
 * Usage: const viewMode = view(modeToggle({ value1: "latest", value2: "historical" }))
 */
export function modeToggle({
  label1 = "Latest",
  label2 = "Historical",
  value1 = "latest",
  value2 = "historical",
  initial = value1,
} = {}) {
  const container = document.createElement("div");
  container.className = "mode-toggle";
  
  const selectedValue = { value: initial };

  // Create two toggle items
  const items = [
    { label: label1, value: value1 },
    { label: label2, value: value2 },
  ];

  items.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "mode-toggle-item";
    itemDiv.dataset.value = item.value;
    itemDiv.textContent = item.label;

    // Apply selection state
    if (item.value === selectedValue.value) {
      itemDiv.classList.add("selected");
    }

    // Click handler
    itemDiv.addEventListener("click", () => {
      selectedValue.value = item.value;
      container.querySelectorAll(".mode-toggle-item").forEach((el) => {
        el.classList.toggle("selected", el.dataset.value === item.value);
      });
      
      // Update container value and dispatch event for Observable
      container.value = item.value;
      container.dispatchEvent(new Event("input", { bubbles: true }));
    });

    container.appendChild(itemDiv);
  });

  // Set initial value
  container.value = initial;

  return container;
}

// Observable viewof wrapper
export function viewofModeToggle(options) {
  const initial = options?.initial || options?.value1 || "latest";
  const selectedValue = { value: initial };

  const view = modeToggle({
    ...options,
    initial: selectedValue.value,
  });

  // Make it reactive by updating view when value changes
  const originalDispatch = view.dispatchEvent.bind(view);
  view.dispatchEvent = function(event) {
    if (event.type === "input") {
      selectedValue.value = view.value;
    }
    return originalDispatch(event);
  };

  // Define value property
  Object.defineProperty(view, "value", {
    get: () => selectedValue.value,
    set: (value) => {
      selectedValue.value = value;
      view.querySelectorAll(".mode-toggle-item").forEach((el) => {
        el.classList.toggle("selected", el.dataset.value === value);
      });
    },
  });

  return view;
}
