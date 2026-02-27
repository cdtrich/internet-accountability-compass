import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function mapSources(world, coast, data, { width, height }) {
  // Filter world data to list of countries
  const worldWithData = world.filter((feature) =>
    data.includes(feature.properties.ISO3_CODE)
  );

  // Fix: Always get a real centroid for polygon or multipolygon
  function largestPolygonCentroid(feature) {
    const { type, coordinates } = feature.geometry;

    if (type === "Polygon") {
      return d3.geoCentroid(feature);
    }

    if (type === "MultiPolygon") {
      const polygons = coordinates.map((rings) => ({
        type: "Polygon",
        coordinates: rings,
      }));

      const largest = polygons.reduce((a, b) =>
        d3.geoArea(a) > d3.geoArea(b) ? a : b
      );

      return d3.geoCentroid({ type: "Feature", geometry: largest });
    }

    return null;
  }

  const worldWithCentroids = worldWithData.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      centroid: largestPolygonCentroid(f),
    },
  }));

  // Create your own projection
  const projection = d3.geoEqualEarth().fitSize([width, height], {
    type: "FeatureCollection",
    features: world,
  });

  // Create the plot
  const plot = Plot.plot({
    width,
    height,
    projection: "equal-earth",
    marks: [
      Plot.geo(world, {
        fill: null,
        stroke: "#ccc",
        strokeWidth: 0.5,
      }),
      Plot.geo(worldWithData, {
        fill: "#32baa8",
        stroke: "#fff",
        strokeWidth: 0.5,
      }),
      Plot.dot(worldWithCentroids, {
        x: (d) => d.properties.centroid[0],
        y: (d) => d.properties.centroid[1],
        r: 5,
        fill: "transparent",
        stroke: "#000",
        strokeWidth: 0.5,
        title: (d) => d.properties.NAME_ENGL,
      }),
    ],
  });

  // Use D3 pointer + projection to find clicked centroid
  plot.addEventListener("click", (event) => {
    const [x, y] = d3.pointer(event);
    const [lon, lat] = projection.invert([x, y]);

    const threshold = 2; // degrees
    const clicked = worldWithCentroids.find((d) => {
      const [cx, cy] = d.properties.centroid;
      return Math.abs(cx - lon) < threshold && Math.abs(cy - lat) < threshold;
    });

    const name = clicked?.properties?.NAME_ENGL ?? null;
    console.log("ðŸ–±ï¸ Clicked country:", name);

    window.dispatchEvent(
      new CustomEvent("map-country-selected", { detail: name })
    );
    // window.dispatchEvent(mapEvent);
  });

  return plot;
}
