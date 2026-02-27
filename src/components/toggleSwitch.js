/**
 * Custom Toggle Switch
 * Works natively with Observable's view() reactivity
 * Usage: const viewMode = view(toggleSwitch({ label1: "Latest", label2: "Historical" }))
 */
export function toggleSwitch({
  label1 = "Latest",
  label2 = "Historical",
  value1 = "latest",
  value2 = "historical",
  initial = value1,
  disabled = false,
} = {}) {
  const container = document.createElement("div");
  container.className = "toggle-switch-container";

  // Label 1
  const leftLabel = document.createElement("span");
  leftLabel.className = "toggle-label toggle-label-left";
  leftLabel.textContent = label1;

  // Switch wrapper
  const switchLabel = document.createElement("label");
  switchLabel.className = "switch";

  // Checkbox
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = initial === value2;

  // Slider
  const slider = document.createElement("span");
  slider.className = "slider round";

  switchLabel.appendChild(input);
  switchLabel.appendChild(slider);

  // Label 2
  const rightLabel = document.createElement("span");
  rightLabel.className = "toggle-label toggle-label-right";
  rightLabel.textContent = label2;

  // Assemble
  container.appendChild(leftLabel);
  container.appendChild(switchLabel);
  container.appendChild(rightLabel);

  // Set initial active states
  function updateLabels(checked) {
    leftLabel.classList.toggle("toggle-label-active", !checked);
    rightLabel.classList.toggle("toggle-label-active", checked);
  }
  updateLabels(input.checked);

  // Observable reads .value
  container.value = initial;

  input.disabled = disabled;
  if (disabled) {
    container.classList.add("toggle-disabled");
  }

  // Method to set disabled state
  container.setDisabled = function (isDisabled) {
    input.disabled = isDisabled;
    container.classList.toggle("toggle-disabled", isDisabled);
  };

  // On change: update value + dispatch input event for Observable
  input.addEventListener("change", function () {
    container.value = this.checked ? value2 : value1;
    updateLabels(this.checked);
    container.dispatchEvent(new Event("input", { bubbles: true }));
  });

  container.reset = function () {
    if (input.checked) {
      input.checked = false;
      updateLabels(false);
      container.value = value1;
      container.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  return container;
}
