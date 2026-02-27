import colorScales from "./scales.js";

export function sources(data) {
  const container = document.getElementById("sources-section");
  container.innerHTML = "";

  if (!data || data.length === 0) return;

  const fillScale = colorScales();

  const anchor = document.createElement("h1");
  anchor.className = "observablehq-header-anchor";
  anchor.href = "#sources";
  anchor.textContent = "Resources";

  const emptyDiv = document.createElement("div");
  emptyDiv.textContent = "";
  container.appendChild(emptyDiv);

  const gridContainer = document.createElement("div");
  gridContainer.className = "grid grid-cols-3";
  container.appendChild(gridContainer);

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "sourcecard";
    card.style.position = "relative"; // For absolute positioning of country name

    // Style type
    if (item.type === "Source") {
      card.style.borderWidth = "0px";
    } else if (item.type === "Analysis") {
      card.style.borderWidth = "0px";
      card.style.fontWeight = "400";
    }

    // Apply border color using pillar_txt and colorScales
    const borderColor = fillScale.getColor(item.pillar_txt);
    card.style.borderStyle = "solid";
    card.style.borderColor = borderColor;
    card.style.backgroundColor = borderColor;

    // Title span with right padding to avoid country name overlap
    const titleSpan = document.createElement("span");
    titleSpan.textContent = item.title;
    titleSpan.style.display = "block";
    titleSpan.style.paddingRight = "120px"; // Space for country name
    card.appendChild(titleSpan);

    // Country name span - right-aligned, smaller, italic
    const countrySpan = document.createElement("span");
    countrySpan.textContent = item.NAME_ENGL;
    countrySpan.className = "sourcecard-country";
    countrySpan.style.position = "absolute";
    countrySpan.style.top = "16px";
    countrySpan.style.right = "16px";
    countrySpan.style.fontSize = "0.85em";
    countrySpan.style.fontStyle = "italic";
    countrySpan.style.color = "#fff";
    countrySpan.style.textAlign = "right";
    card.appendChild(countrySpan);

    const isValidURL = item.url && item.url.trim() !== "NA";

    const wrapper = document.createElement("a");
    wrapper.href = isValidURL
      ? item.url
      : `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
          "https://raw.githubusercontent.com/cdtrich/dfi/46978462ce4d3bc30f6305b4e03ce11104e3cc00/src/data/sources/" +
            item.filename +
            ".pdf"
        )}`;
    wrapper.target = "_blank";
    wrapper.style.display = "block";
    wrapper.style.textDecoration = "none";

    wrapper.appendChild(card);
    gridContainer.appendChild(wrapper);
  });
}
