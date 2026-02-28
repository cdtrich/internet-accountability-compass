import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import colorScales from "./scales.js";

export function mapTotalScorecard(world, data, { width, height }) {
  //   console.log("mapTotal data", data);

  // DATA --------------------------------
  // Filter data if a pillar is selected
  const filteredData = data.filter(
    (d) => d.pillar_txt === "Enabling Environment" // select only one pillar
  );

  // Merge the world data with the filtered data
  // Using a Map for O(1) lookups instead of O(n) with find()
  const dataMap = new Map(filteredData.map((item) => [item.ISO3_CODE, item]));

  const worldWithData = world.map((feature) => {
    const matchingData = dataMap.get(feature.properties.ISO3_CODE);

    return matchingData
      ? { ...feature, properties: { ...feature.properties, ...matchingData } }
      : feature;
  });
  // console.log("worldWithData (in mapTotal)", worldWithData);

  const worldWithDataBins = worldWithData.map((d) => {
    d.properties = {
      ...d.properties, // include all other existing properties
      bin:
        d.properties.total < 20
          ? "<20"
          : d.properties.total < 40
          ? "20-39"
          : d.properties.total < 60
          ? "40-59"
          : d.properties.total < 80
          ? "60-79"
          : ">79",
    };
    return d;
  });
  // console.log("worldWithDataBins (in mapTotal)", worldWithDataBins);

  //   range
  const [min, max] = d3.extent(filteredData, (d) => d.total);

  // get colorsScales()
  const fillScale = colorScales();

  // INTERACTION --------------------------------
  // Create a container element to hold the visualization
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column"; // âœ… Stack map + scorecard vertically

  // Create map and scorecard divs
  const mapDiv = document.createElement("div");

  // Row div for scorecard elements to be next to each other
  const scorecardRow = document.createElement("div");
  scorecardRow.style.display = "flex";
  scorecardRow.style.flexDirection = "row"; // âœ… Ensure scorecard elements are inline
  scorecardRow.style.marginBottom = "0px";
  scorecardRow.style.justifyContent = "flex-end"; // âœ… Right-aligns the scorecard
  scorecardRow.style.height = "20px";

  // Scorecard component
  const scorecardDiv = document.createElement("div");
  scorecardDiv.style.display = "flex"; // âœ… Ensure items appear in a single line
  scorecardDiv.style.flexDirection = "row";
  scorecardDiv.style.gap = "20px"; // âœ… Spacing between values
  scorecardDiv.textContent = "Hover over a region"; // Default text
  scorecardDiv.style.justifyContent = "flex-end"; // âœ… Right-aligns the scorecard

  // Append elements to the container correctly
  container.appendChild(scorecardRow); // âœ… Scorecard follows the map
  container.appendChild(mapDiv);
  scorecardRow.appendChild(scorecardDiv); // âœ… Place scorecard inside the row

  // Function to update the scorecard
  function updateScorecard(regionName) {
    // Filter data based on the hovered region
    const filteredData = data.filter((d) => d.NAME_ENGL === regionName);

    // If no data, show a default message
    if (filteredData.length === 0) {
      scorecardDiv.textContent = `No data for ${regionName}`;
      return;
    }

    // Clear previous content
    scorecardDiv.innerHTML = "";

    // Create rows for each data item
    filteredData.forEach((d) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";

      // Dot element
      const dot = document.createElement("span");
      dot.style.width = "12px";
      dot.style.height = "12px";
      dot.style.borderRadius = "50%";
      dot.style.display = "inline-block";
      dot.style.backgroundColor = fillScale.getColor(d.pillar_txt, d.value);
      // dot.style.backgroundColor = fillScale.getColor(d.pillar_txt, 100);
      dot.style.marginRight = "8px";

      // Text for pillar and value
      const text = document.createElement("span");
      text.textContent = `${d.pillar_txt}: `;

      // Bold value
      const value = document.createElement("span");
      value.textContent = Math.round(d.value, 1);
      value.style.fontWeight = "bold";

      // Append elements inline
      row.appendChild(dot);
      row.appendChild(text);
      row.appendChild(value);

      // Append row to scorecardDiv
      scorecardDiv.appendChild(row);
    });
  }

  // MAP --------------------------------

  // Render the map
  const options = {
    projection: "equal-earth",
    width: width,
    // opacity: {
    //   legend: true,
    //   range: [0, 1],
    //   domain: [min, max],
    // },
    color: {
      legend: true,
      type: "ordinal",
      range: [
        fillScale.getColor("Total", 0),
        fillScale.getColor("Total", 25),
        fillScale.getColor("Total", 50),
        fillScale.getColor("Total", 75),
        fillScale.getColor("Total", 100),
      ],
      domain: ["<20", "20-39", "40-59", "60-79", ">79"],
      // interval: 20,
      // range: [fillScale.getColor("Total", 0), fillScale.getColor("Total", 100)],
      // domain: [0, 100],
    },
    marks: [
      // colored countries
      Plot.geo(worldWithDataBins, {
        fill: (d) => (isNaN(d.properties.value) ? "#fff" : d.properties.bin),
        stroke: "#fff",
        strokeWidth: 0.5,
        href: (d) => d.properties.country_url,
      }),
      // World outline
      Plot.geo(worldWithData, {
        stroke: (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"),
        strokeWidth: 0.5,
      }),
      // country labels
      Plot.dot(
        worldWithData,
        Plot.centroid({
          stroke: null,
          href: (d) => d.properties.country_url,
        })
      ),
      // tooltip
      Plot.tip(
        worldWithDataBins,
        Plot.centroid(
          Plot.pointer({
            // filter: (d) => d.geometry, // Ensure valid geometry
            // onmouseover: (event, d) => updateScorecard(d.properties.NAME_ENGL),
            title: (d) =>
              `${
                isNaN(d.properties.total)
                  ? "no data"
                  : Math.round(d.properties.total, 1)
              }\n${d.properties.NAME_ENGL}`,
            stroke: "#fff",
          })
        )
      ),
    ],
  };

  // Create the map
  const plot = Plot.plot(options);

  // Listen for pointer hover events
  plot.addEventListener("input", (event) => {
    const hoveredData = plot.value;
    if (hoveredData && hoveredData.properties) {
      updateScorecard(hoveredData.properties.NAME_ENGL);
    } else {
      scorecardDiv.textContent = "Hover over a region";
    }
  });

  // Append map and scorecard to container
  container.appendChild(scorecardDiv);
  container.appendChild(plot);

  return container; // Return the container for Observable
}
