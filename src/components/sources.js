import { SOURCE_TYPE_COLORS } from "./sourcesLegend.js";

export function sources(data) {
  const container = document.getElementById("sources-section");
  container.innerHTML = "";

  if (!data || data.length === 0) return;

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

    const tileColor = SOURCE_TYPE_COLORS[item.type] ?? "#ccc";
    // Use dark text on light tiles (e.g. yellow), white on dark tiles
    const { r, g, b } = {
      r: parseInt(tileColor.slice(1, 3), 16),
      g: parseInt(tileColor.slice(3, 5), 16),
      b: parseInt(tileColor.slice(5, 7), 16),
    };
    const textColor =
      (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#333" : "#fff";

    card.style.borderStyle = "solid";
    card.style.borderWidth = "0px";
    card.style.borderColor = tileColor;
    card.style.backgroundColor = tileColor;
    card.style.color = textColor;

    // Title
    const titleSpan = document.createElement("span");
    titleSpan.textContent = item.title;
    titleSpan.style.display = "block";
    titleSpan.style.color = textColor;
    card.appendChild(titleSpan);

    // Publisher name — left-aligned, below title, tight spacing
    const publisherSpan = document.createElement("span");
    publisherSpan.textContent = item.publisher;
    publisherSpan.className = "sourcecard-publisher";
    publisherSpan.style.display = "block";
    publisherSpan.style.marginTop = "0px";
    publisherSpan.style.fontSize = "0.85em";
    publisherSpan.style.color = textColor;
    card.appendChild(publisherSpan);

    // Country name — right-aligned, tight spacing
    const countrySpan = document.createElement("span");
    countrySpan.textContent = item.NAME_ENGL;
    countrySpan.className = "sourcecard-country";
    countrySpan.style.display = "block";
    countrySpan.style.marginTop = "0px";
    countrySpan.style.textAlign = "right";
    countrySpan.style.fontSize = "0.85em";
    countrySpan.style.fontStyle = "italic";
    countrySpan.style.color = textColor;
    card.appendChild(countrySpan);

    const isValidURL = item.url && item.url.trim() !== "NA";

    const wrapper = document.createElement("a");
    wrapper.href = isValidURL
      ? item.url
      : `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
          "https://raw.githubusercontent.com/cdtrich/dfi/46978462ce4d3bc30f6305b4e03ce11104e3cc00/src/data/sources/" +
            item.filename +
            ".pdf",
        )}`;
    wrapper.target = "_blank";
    wrapper.style.display = "block";
    wrapper.style.textDecoration = "none";

    wrapper.appendChild(card);
    gridContainer.appendChild(wrapper);
  });
}
