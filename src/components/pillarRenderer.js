import { pillarText } from "./pillarText.js";

export function renderPillarContent(
  pillarTitle,
  targetSelector = "#pillar-content"
) {
  const container = document.querySelector(targetSelector);
  if (!container) return;

  const match = pillarText.find((p) => p.title === pillarTitle);
  container.innerHTML = match
    ? match.paragraphs.map((p) => `<p>${p}</p>`).join("")
    : "<p>No content found.</p>";
}
