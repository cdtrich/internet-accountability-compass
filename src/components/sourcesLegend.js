import * as Plot from "npm:@observablehq/plot";

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
