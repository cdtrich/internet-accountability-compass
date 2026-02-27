import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import colorScales from "./scales.js";
// https://observablehq.com/@observablehq/plot-radar-chart

export function polarCountry(data, country) {
  // chart width
  const vw = window.innerWidth;
  const dotSize = window.innerWidth * 0.006;

  const latestYear = d3.max(data, (d) => d.year);

  const dataFiltered = data.filter(
    (d) => d.NAME_ENGL === country && d.year === latestYear,
  );
  // console.log("polarCountry dataFiltered", dataFiltered);
  // total label
  const dataTotal = dataFiltered.filter((d) => d.commitment_num_cardinal === 5);
  // console.log("polarCountry dataTotal", dataTotal);
  // total line
  // var dataTotalLine = dataFiltered;
  // dataTotalLine.push({ ...dataTotalLine[0] });

  // get colorsScales()
  const fillScale = colorScales();
  const longitude = d3
    .scalePoint(
      new Set(Plot.valueof(dataFiltered, "commitment_num_cardinal")),
      [180, -180],
    )
    .padding(0.5)
    .align(1);

  // console.log("dataFiltered", dataFiltered);
  const legend = [...new Set(dataFiltered.map((item) => item.pillar_txt))];
  // console.log("legend", legend);
  // console.log(fillScale.getColor(legend[1]));

  // PLOT //////////////////////////
  const plot = Plot.plot({
    width: vw / 4,
    marginTop: -60,
    // x: { axis: "top", label: null },
    // y: { label: null },
    // title: `${Math.floor(dataFiltered[0].total)}`,
    // subtitle: (${dataFiltered[0].group)},
    projection: {
      type: "azimuthal-equidistant",
      rotate: [-60, -90],
      // Note: 1.22Â° corresponds to max. percentage (1.0), plus some room for the labels
      domain: d3.geoCircle().center([0, 90]).radius(1.22)(),
    },
    color: {
      domain: legend,
      range: [
        fillScale.getColor(legend[0]),
        fillScale.getColor(legend[1]),
        fillScale.getColor(legend[2]),
        fillScale.getColor(legend[3]),
      ],
      legend: false,
    },
    r: {
      range: [1, dotSize / 2],
    },
    marks: [
      // grey discs
      Plot.geo([1.0, 0.8, 0.6, 0.4, 0.2], {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "black",
        fill: "black",
        strokeOpacity: 0.3,
        fillOpacity: 0.01,
        strokeWidth: 0.5,
      }),

      // grey areas
      // Plot.area(dataFiltered, {
      //   x1: (d) => longitude(d.commitment_num_cardinal),
      //   y1: (d) => (isNaN(d.value) ? 90 : 90 - d.value / 100),
      //   x2: 0,
      //   y2: 90,
      //   z: "ISO3_CODE",
      //   stroke: "#ccc",
      //   fill: (d) => fillScale.getColor("Total", d.total),
      //   fillOpacity: 0.1,
      //   curve: "cardinal-closed",
      // }),

      // total score
      Plot.lineX(dataFiltered, {
        x: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y: ({ total }) => 90 - total / 100,
        text: (d) => Math.floor(d.total),
        strokeWidth: 1,
        fill: "#000",
        stroke: "#aaa",
        fillOpacity: 0.1,
        strokeOpacity: 1,
        curve: "catmull-rom-closed",
      }),

      // cardinal lines
      Plot.link(dataFiltered, {
        x1: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y1: ({ value }) => 90 - value / 100,
        x2: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y2: 90,
        stroke: (d) => fillScale.getColor(d.pillar_txt),
        // stroke: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        strokeWidth: dotSize * 0.66,
        // strokeWidth: (d) => d.value / dotSize / 4,
      }),

      // multiple cardinal lines (for V-shaped width)
      Plot.link(dataFiltered, {
        x1: (d) => longitude(d.commitment_num_cardinal) - 2,
        y1: ({ value }) => 90 - value / 100,
        x2: (d) => longitude(d.commitment_num_cardinal),
        y2: 90,
        stroke: (d) => fillScale.getColor(d.pillar_txt, d.value),
        // stroke: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        strokeWidth: dotSize,
        opacity: 0.5,
      }),
      Plot.link(dataFiltered, {
        x1: (d) => longitude(d.commitment_num_cardinal) + 2,
        y1: ({ value }) => 90 - value / 100,
        x2: (d) => longitude(d.commitment_num_cardinal),
        y2: 90,
        stroke: (d) => fillScale.getColor(d.pillar_txt),
        // stroke: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        strokeWidth: dotSize,
        opacity: 0.5,
      }),

      // white dot in center
      Plot.geo([0.03], {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: null,
        fill: "#fff",
        fillOpacity: 1,
      }),

      Plot.dot(dataFiltered, {
        x: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y: ({ value }) => 90 - value / 100,
        fill: (d) => fillScale.getColor(d.pillar_txt),
        stroke: "#fff",
        strokeWidth: dotSize / 2,
        r: dotSize,
      }),

      // total score label
      Plot.text(dataTotal, {
        x: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y: ({ value }) => 90 - 110 / 100,
        // y: (d) => 0.1,
        // text: Math.floor("total"),
        text: (d) => Math.floor(d.total),
        color: "#000",
        fontSize: 20,
        // strokeWidth: 0,
        // strokeWidth: 5,
        fontWeight: 500,
        // title: (d) => Math.floor(d.total),
      }),
      Plot.text(dataTotal, {
        x: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y: ({ value }) => 90 - 120 / 100,
        // y: (d) => 0.1,
        // text: Math.floor("total"),
        text: (d) => `(${d.group})`,
        color: "#000",
        fontSize: 30,
        // strokeWidth: 0,
        // strokeWidth: 5,
        // title: (d) => Math.floor(d.total),
      }),

      // interactive labels
      Plot.tip(
        dataFiltered,
        Plot.pointer({
          x: ({ commitment_num_cardinal }) =>
            longitude(commitment_num_cardinal),
          y: ({ value }) => 90 - value / 100,
          title: (d) =>
            `${Math.floor(d.value)}` + "\n" + `${d.commitment_txt_cardinal}`,
          dx: 4,
          stroke: "white",
          anchor: "bottom",
          fontSize: 100,
        }),
      ),
    ],
  });
  return plot;
}
