import * as Plot from "../../_npm/@observablehq/plot@0.6.17/7c43807f.js";

export function sourcesLegend(sources, { width, height }) {
  const sourcesUnique = [...new Set(sources.map((item) => item.type))];

  // Render the legend
  const legend = Plot.plot({
    width: width,
    height: 0,
    color: {
      legend: true,
      type: "ordinal",
      range: ["#fff", "#fff", "#fff"],
      domain: sourcesUnique,
    },
  });

  return legend;
}
