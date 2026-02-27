import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import colorScales from "./scales.js";

export function straightPlot(data, country, pillar, { width, height } = {}) {
  const latestYear = d3.max(data, (d) => d.year);

  // filter data for selected country
  const filterData = data
    .filter((d) => d.NAME_ENGL === country)
    .filter((d) => d.pillar_txt === pillar)
    .filter((d) => d.year === latestYear);

  const pillarData = data.filter((d) => d.pillar_txt === pillar);
  // console.log("filterData", filterData);

  // calculate mean
  const mean = d3.flatRollup(
    pillarData,
    (v) => d3.mean(v, (d) => d.value),
    (d) => d.commitment_num_cardinal,
  );

  // turn mean map into object
  const meanObject = mean.map(([commitment_num_cardinal, value]) => ({
    commitment_num_cardinal,
    value,
  }));
  // console.log("meanObject", meanObject);
  // console.log(meanObject);

  const indexMean = d3.index(meanObject, (d) => d.commitment_num_cardinal);
  const distance = filterData
    .map(({ commitment_num_cardinal, value: x1 }) => ({
      commitment_num_cardinal,
      x1,
      ...indexMean.get(commitment_num_cardinal),
    }))
    .filter((d) => d.x1 !== "NA");
  // console.log("distance", distance);
  // console.log("distance first", distance[0]);

  distance.forEach((item) => {
    const difference = (item.x1 - item.value).toFixed(1); // Calculate and round the difference to one decimal
    const comparison =
      item.x1 > item.value
        ? "points above"
        : item.x1 < item.value
          ? "points below"
          : "equal to";
    item.comparison = `${Math.abs(difference)} ${comparison} average`;
  });
  // console.log("distance", distance);

  // manual facet labels
  const n = 1; // number of facet columns
  const keys = Array.from(
    d3.union(pillarData.map((d) => d.commitment_txt_cardinal)),
  );
  // const index = new Map(keys.map((key, i) => [key, i]));
  // const fx = (key) => index.get(key) % n;
  // const fy = (key) => Math.floor(index.get(key) / n);

  // Get the extent (min and max) of the `value` property
  const [min, max] = d3.extent(pillarData, (d) => d.value);
  const fact = 0.05; // factor to subtract/add to range

  // Round down the min and round up the max
  const roundedMinMax = [
    Math.floor(min) - min * fact,
    Math.ceil(max) + max * fact,
  ];

  // Use a Set to track unique commitment_num values
  const uniqueCommitments = new Set();
  const filteredData = pillarData.filter((item) => {
    if (!uniqueCommitments.has(item.commitment_txt_cardinal)) {
      uniqueCommitments.add(item.commitment_txt_cardinal);
      return true;
    }
    return false;
  });

  // console.log(filteredData);

  // CALCULATE COUNT PER VALUE
  // Summarize and group data
  const summarized = data.reduce((acc, d) => {
    // Define the group key for summarization based on selected properties
    const key = `${d.commitment_txt_cardinal}-${d.pillar_num_cardinal}-${d.value}`;

    // If the group doesn't exist, initialize it with relevant properties
    if (!acc[key]) {
      acc[key] = {
        ...d, // Copy all properties initially
        n: 0, // Initialize count
        uniqueNames: new Set(), // Track unique NAME_ENGL values
      };
    }

    // Increment count
    acc[key].n += 1;

    // Track NAME_ENGL for this group
    acc[key].uniqueNames.add(d.NAME_ENGL);

    return acc;
  }, {});

  // Finalize and clean up results
  const groupedCountsGlobal = Object.values(summarized).map((item) => {
    // Replace NAME_ENGL with a dynamic string if there are multiple unique values
    if (item.uniqueNames.size > 1) {
      item.NAME_ENGL = `${item.n} countries`;
      item.ISO3_CODE = null;
    }

    // Remove the helper Set property
    delete item.uniqueNames;

    return item;
  });

  const groupedCounts = groupedCountsGlobal.filter(
    (d) => d.pillar_txt === pillar,
  );
  // console.log("groupedCounts", groupedCounts);

  // get colorsScales()
  const fillScale = colorScales();

  // window height
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dotSize = window.innerWidth * 0.01;

  return Plot.plot({
    width: width,
    // marginLeft: width * 0.2,
    height: (vh / 5) * mean.length,
    marginRight: 4,
    marginTop: 100,
    marginBottom: 55,
    x: { label: null, domain: [0, 105], ticks: [0, 25, 50, 75, 100] },
    y: { label: null, axis: null, tickSize: 0 },
    r: {
      range: [dotSize / 4, dotSize * 3],
      domain: [
        d3.min(groupedCountsGlobal, (d) => d.n),
        d3.max(groupedCountsGlobal, (d) => d.n),
      ],
    },
    color: {
      legend: true,
    },
    ticks: false,
    facet: {
      // data: groupedCounts,
      // y: "commitment_num_cardinal",
      label: null,
    },
    fy: { padding: 0.8 },
    marks: [
      // TOP AXIS
      Plot.axisX({
        anchor: "top",
        dy: -60,
        stroke: "#ccc",
        // strokeOpacity: 0.2,
        strokeWidth: 0.5,
        domain: [-10, 110],
        ticks: [0, 25, 50, 75, 100],
        label: "Score",
        // tickLength: 5,
      }),
      // MEAN MARKER
      // Plot.dot(meanObject, {
      //   x: "value",
      //   fy: "commitment_num_cardinal",
      //   stroke: "#473d3a",
      //   strokeOpacity: 1,
      //   strokeWidth: 1,
      //   r: 5,
      // }),
      // label
      // Plot.text(
      //   meanObject.filter((d) => d.commitment_num === 1),
      //   {
      //     x: "value",
      //     y: 0,
      //     dy: 20,
      //     fy: "commitment_num_cardinal",
      //     text: (d) => "Mean value",
      //     textAnchor: "middle",
      //     // fontWeight: 700,
      //     fontFace: "italic",
      //     fontSize: 14,
      //   }
      // ),
      // DISTANCE FROM MEAN
      Plot.arrow(distance, {
        x1: "x1",
        x2: "value",
        y1: 0,
        y2: 0,
        // dy: 7,
        fy: "commitment_num_cardinal",
        stroke: "#000",
        strokeWidth: 1.5,
        strokeOpacity: 1,
        bend: 45 / 2,
      }),
      // ALL DOTS
      Plot.dot(
        groupedCounts,
        Plot.dodgeY("middle", {
          x: "value",
          y: 0,
          fy: "commitment_num_cardinal",
          fill: (d) => fillScale.getColor(d.pillar_txt),
          stroke: (d) => fillScale.getColor(d.pillar_txt),
          fillOpacity: 0.2,
          strokeOpacity: 1,
          // fillOpacity: (d) => (d.NAME_ENGL === country ? 1 : 0),
          // strokeOpacity: (d) => (d.NAME_ENGL === country ? 1 : 0.5),
          r: "n",
          strokeWidth: 1,
          href: (d) => (d.ISO3_CODE ? `/${d.ISO3_CODE}` : null),
        }),
      ),
      // pointer
      Plot.dot(
        groupedCounts,
        Plot.pointer(
          Plot.dodgeY("middle", {
            x: "value",
            y: 0,
            fy: "commitment_num_cardinal",
            fill: (d) => fillScale.getColor(d.pillar_txt, d.value),
            stroke: (d) => fillScale.getColor(d.pillar_txt),
            r: "n",
            fillOpacity: 1,
            strokeOpacity: 1,
            strokeWidth: 5,
            href: (d) => (d.ISO3_CODE ? `/${d.ISO3_CODE}` : null),
          }),
        ),
      ),
      // HIGHLIGHTED COUNTRY
      Plot.ruleY({
        x: "value",
        fy: "commitment_num_cardinal",
        stroke: "#000",
        strokeWidth: 2,
      }),
      // white transparent area behind marker
      // Plot.tickX(filterData, {
      //   x: "value",
      //   y1: 0.15,
      //   y2: -0.15,
      //   fy: "commitment_num_cardinal",
      //   stroke: "#fff",
      //   strokeWidth: 15,
      //   strokeOpacity: 0.6,
      // }),
      Plot.tickX(filterData, {
        x: "value",
        y1: 0.15,
        y2: -0.15,
        fy: "commitment_num_cardinal",
        stroke: (d) => fillScale.getColor(d.pillar_txt),
        strokeWidth: 4,
        strokeOpacity: 1,
      }),
      // country label
      Plot.text(
        filterData,
        Plot.selectFirst({
          x: "value",
          y: 0,
          dy: 20,
          fill: (d) => fillScale.getColor(d.pillar_txt),
          fy: "commitment_num_cardinal",
          text: "NAME_ENGL",
          textAnchor: "middle",
          lineWidth: 7,
          lineAnchor: "top",
          fontWeight: 700,
          stroke: "#fff",
          strokeWidth: 4,
          fontSize: 14,
        }),
      ),
      // average label
      Plot.text(
        distance,
        // {
        Plot.selectFirst({
          x: (d) => (d.x1 + d.value) / 2,
          // y: (d) => (d.value - d.x1 < 0 ? -1 : 1),
          y: 0,
          dy: 40,
          lineWidth: 8,
          lineAnchor: "top",
          fy: (d) => distance[0].commitment_num_cardinal,
          text: (d) => d.comparison,
          fill: "#000",
          stroke: "#fff",
          strokeWidth: 5,
          // fontSize: 14,
          // }
        }),
      ),
      // FACET LABELS
      Plot.text(pillarData, {
        x: 0,
        // dx: -30,
        y: 0,
        dy: -50,
        fy: "commitment_num_cardinal",
        text: "commitment_txt_cardinal",
        frameAnchor: "top-left",
        textAnchor: "start",
        fontSize: "1.5em",
        fill: (d) => fillScale.getColor(d.pillar_txt),
        stroke: "#fff",
        strokeWidth: 5,
        fontSize: "18px",
      }),
      // tip for DISTANCE FROM MEAN
      Plot.tip(
        distance,
        Plot.pointer({
          x: (d) => (d.x1 + d.value) / 2,
          y: 0,
          dy: 5,
          fy: "commitment_num_cardinal",
          stroke: "#fff",
          anchor: "top",
          title: "comparison",
          tip: true,
        }),
      ),
      // tip for ALL DOTS
      Plot.tip(
        groupedCounts,
        Plot.pointer(
          Plot.dodgeY("middle", {
            x: "value",
            y: 0,
            dy: -5,
            fy: "commitment_num_cardinal",
            stroke: "#fff",
            anchor: "bottom",
            tip: true,
            title: "NAME_ENGL",
            href: (d) => (d.ISO3_CODE ? `/${d.ISO3_CODE}` : null),
          }),
        ),
      ),
    ],
  });
}
