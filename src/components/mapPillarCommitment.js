import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import colorScales from "./scales.js";

export function mapPillarCommitment(
  world,
  data,
  selectPillar,
  select,
  { width }
) {
  // console.log("select mapPillarCommitment", select);
  // console.log("data mapPillarCommitment", data);
  // const selectedPillarNumber = lookupObject[select] + 1;
  // console.log("selectedPillarNumber", selectedPillarNumber);

  // Filter the data based on the pillar number
  const filteredData = data.filter(
    (item) => item.commitment_txt_cardinal === select
  );
  // console.log("filteredData commitment", filteredData);

  // Use flatMap to create a new array with multiple entries per feature
  const worldWithData = world.flatMap((feature) => {
    // Get all matching data entries for this feature's ISO3_CODE
    const matchingDataEntries = filteredData.filter(
      (item) => item.ISO3_CODE === feature.properties.ISO3_CODE
    );

    if (matchingDataEntries.length > 0) {
      // Create one new feature for each matching data entry
      return matchingDataEntries.map((dataItem) => ({
        ...feature,
        properties: {
          ...feature.properties,
          ...dataItem,
        },
      }));
    } else {
      // Keep the original feature if no matching data
      return [feature];
    }
  });

  // get colorsScales()
  const fillScale = colorScales();

  // console.log("data mapPillarCommitment", data);
  // Render the map
  const map = Plot.plot({
    projection: "equal-earth",
    width: width,
    facet: { label: null },
    color: {
      legend: true,
      type: "ordinal",
      range: [
        fillScale.getOrdinalCategoryScale(selectPillar)("Off track"),
        fillScale.getOrdinalCategoryScale(selectPillar)("Catching up"),
        fillScale.getOrdinalCategoryScale(selectPillar)("On track"),
        fillScale.getOrdinalCategoryScale(selectPillar)("Leading"),
      ],
      domain: ["Off track", "Catching up", "On track", "Leading"],
    },
    marks: [
      // colored countries
      Plot.geo(worldWithData, {
        // fill: (d) =>
        //   isNaN(d.properties.value) ? "#fff" : d.properties.group_value,
        fill: (d) =>
          isNaN(d.properties.value)
            ? "#fff"
            : fillScale.getOrdinalCategoryScale(d.properties.pillar_txt)(
                d.properties.group_value
              ),
        stroke: "#fff",
        strokeWidth: 0.25,
        fy: (d) => d.properties.commitment_txt,
        href: (d) => d.properties.country_url,
      }),
      // World outline
      Plot.geo(worldWithData, {
        stroke: (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"),
        strokeWidth: 0.25,
      }),
      // country labels
      Plot.tip(
        worldWithData,
        Plot.centroid(
          Plot.pointer({
            fy: (d) => d.properties.commitment_txt,
            title: (d) =>
              `${
                isNaN(d.properties.value)
                  ? "no data"
                  : Math.round(d.properties.value, 1)
              }\n${d.properties.NAME_ENGL}`,
            stroke: "#fff",
          })
        )
      ),
    ],
  });

  return map;
}
