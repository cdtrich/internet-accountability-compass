import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import colorScales from "./scales.js";

// https://observablehq.com/@observablehq/plot-radar-chart

export function polar(data, isMobile, { width, height } = {}) {
  // chart width
  const vw = window.innerWidth;
  const dotSize = window.innerWidth * 0.006;
  // console.log("polar data", data);
  // get unique country names
  const countryNames = data.filter(
    (d, index, self) =>
      self.findIndex((item) => item.NAME_ENGL === d.NAME_ENGL) === index
  );
  // total label
  const dataTotal = data;

  // get colorsScales()
  const fillScale = colorScales();
  const longitude = d3
    .scalePoint(new Set(Plot.valueof(data, "commitment_num")), [180, -180])
    .padding(0.5)
    .align(1);

  // select first occurence of each country for facets
  const uniqueByName = [];
  const seen = new Set();

  for (const d of data) {
    if (!seen.has(d.NAME_ENGL)) {
      seen.add(d.NAME_ENGL);
      uniqueByName.push(d);
    }
  }

  // legend items
  const legend = [...new Set(data.map((item) => item.pillar_txt))];

  // PLOT //////////////////////////
  const plot = Plot.plot({
    width: width * 0.9,
    marginLeft: width * 0.1,
    marginTop: 10,
    height: isMobile ? width * 80 : width * 6,
    // subtitle: "Click on a country name to go to the country profile",
    // x: { axis: "top", label: null },
    // y: { label: null },
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
      legend: true,
    },
    r: {
      range: [1, dotSize / 2],
    },
    facet: {
      data,
      x: (d) => (isMobile ? 0 : d.fx),
      y: (d) => (isMobile ? d.NAME_ENGL : d.fy),
      axis: null,
    },
    marks: [
      // grey discs
      Plot.geo([1.0, 0.8, 0.6, 0.4, 0.2], {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "black",
        fill: "#fff",
        strokeOpacity: 0.3,
        fillOpacity: 1,
        strokeWidth: 0.5,
      }),

      // Facet name (country name)
      Plot.text(
        data,
        Plot.selectFirst({
          text: "NAME_ENGL",
          frameAnchor: "top",
          fontWeight: "700",
          fontSize: 14 * 2,
          lineAnchor: "top",
          fill: "#000",
          lineWidth: 8,
          href: (d) => d.country_url,
        })
      ),

      // axes labels (in legend)
      Plot.text(longitude.domain(), {
        fx: isMobile ? 0 : 0,
        fy: isMobile ? 0 : 0,
        x: longitude,
        y: 90 - 1.15,
        text: Plot.identity,
        lineWidth: 5,
        fontSize: 12,
      }),

      // axes labels, initials
      // Plot.text(longitude.domain(), {
      //   fx: 0,
      //   fy: 0,
      //   facet: "exclude",
      //   x: longitude,
      //   y: 90 - 1.09,
      //   text: (d) => d,
      //   lineWidth: 5,
      // }),

      // grey areas
      // Plot.area(data, {
      //   x1: (d) => longitude(d.commitment_num_cardinal),
      //   y1: (d) => (isNaN(d.value) ? 90 : 90 - d.value / 100),
      //   x2: 0,
      //   y2: 90,
      //   z: "ISO3_CODE",
      //   stroke: "#ccc",
      //   fill: (d) => fillScale.getColor("Total", d.total),
      //   // fill: "#ccc",
      //   fillOpacity: 0.1,
      //   curve: "cardinal-closed",
      // }),

      // connecting lines at top
      // Plot.line(data, {
      //   x: (d) => longitude(d.commitment_num_cardinal),
      //   y: (d) => (isNaN(d.value) ? 90 : 90 - d.value / 100),
      //   z: "pillar_num",
      //   stroke: (d) => fillScale.getColor(d.pillar_txt),
      //   curve: "cardinal-closed",
      // }),

      // total score
      Plot.lineX(data, {
        x: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y: ({ total }) => 90 - total / 100,
        // color: "#000",
        strokeWidth: 1,
        fill: "#000",
        stroke: "#aaa",
        fillOpacity: 0.1,
        strokeOpacity: 1,
        curve: "catmull-rom-closed",
      }),

      // cardinal lines
      Plot.link(data, {
        x1: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y1: ({ value }) => 90 - value / 100,
        x2: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y2: 90,
        stroke: (d) => fillScale.getColor(d.pillar_txt),
        // stroke: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        strokeWidth: dotSize / 4,
        // strokeWidth: (d) => d.value / dotSize / 4,
      }),

      // multiple cardinal lines (for V-shaped width)
      Plot.link(data, {
        x1: (d) => longitude(d.commitment_num_cardinal) - 2,
        y1: ({ value }) => 90 - value / 100,
        x2: (d) => longitude(d.commitment_num_cardinal),
        y2: 90,
        stroke: (d) => fillScale.getColor(d.pillar_txt, d.value),
        // stroke: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        strokeWidth: isMobile ? dotSize * 2 : dotSize / 3,
        opacity: 0.5,
      }),
      Plot.link(data, {
        x1: (d) => longitude(d.commitment_num_cardinal) + 2,
        y1: ({ value }) => 90 - value / 100,
        x2: (d) => longitude(d.commitment_num_cardinal),
        y2: 90,
        stroke: (d) => fillScale.getColor(d.pillar_txt),
        // stroke: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        strokeWidth: isMobile ? dotSize * 2 : dotSize / 3,
        opacity: 0.5,
      }),

      // white dot in center
      Plot.geo([0.03], {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: null,
        fill: "#fff",
        fillOpacity: 1,
      }),

      // cardinal points
      Plot.dot(data, {
        x: ({ commitment_num_cardinal }) => longitude(commitment_num_cardinal),
        y: ({ value }) => 90 - value / 100,
        fill: (d) => fillScale.getColor(d.pillar_txt),
        // fill: (d) =>
        //   fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
        stroke: "#fff",
        r: isMobile ? dotSize * 1.5 : dotSize / 3,
      }),

      // total score label
      Plot.text(
        dataTotal,
        Plot.selectFirst({
          x: ({ commitment_num_cardinal }) => longitude(5),
          y: ({ value }) => 90 - 110 / 100,
          text: (d) => `${Math.floor(d.total)} (${d.group})`,
          frameAnchor: "bottom",
          fontSize: 14,
          fontWeight: 400,
          dy: 10,
        })
      ),
      // Plot.text(
      //   dataTotal,
      //   Plot.selectFirst({
      //     x: ({ commitment_num_cardinal }) => longitude(5),
      //     y: ({ value }) => 90 - 110 / 100,
      //     // y: (d) => 0.1,
      //     // text: Math.floor("total"),
      //     text: (d) => `(${d.group})`,
      //     // text: "NAME_ENGL",
      //     frameAnchor: "bottom",
      //     fontSize: 14,
      //     dy: 25,
      //   })
      // ),

      // tooltip
      Plot.tip(
        data,
        Plot.pointer({
          x: ({ commitment_num_cardinal }) =>
            longitude(commitment_num_cardinal),
          y: ({ value }) => 90 - value / 100,
          title: (d) =>
            `${Math.floor(d.value)}` + "\n" + `${d.commitment_txt_cardinal}`,
          // text: (d) => `${d.commitment_txt}\n${Math.floor(d.value)}`,
          textAnchor: "center",
          dx: 4,
          // fill: "currentColor",
          stroke: "white",
          // maxRadius: 10,
          // fontSize: 12,
        })
      ),

      // average
      Plot.geo([0.7], {
        fx: isMobile ? 0 : 0,
        fy: isMobile ? 0 : 0,
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "black",
        fill: "#000",
        stroke: "#ccc",
        fillOpacity: 0.1,
        strokeOpacity: 1,
        // fillOpacity: 0,
        strokeWidth: 1,
      }),
      Plot.text(["Total"], {
        fx: isMobile ? 0 : 0,
        fy: isMobile ? 0 : 0,
        x: 147 - 180 + 93,
        y: 90 - 0.65,
        dx: 2,
        textAnchor: "middle",
        text: (d) => d,
        fill: "currentColor",
        stroke: "white",
        strokeWidth: 5,
        fontSize: 12,
      }),

      // tick labels
      Plot.text([0, 20, 40, 60, 80, 100], {
        fx: isMobile ? 0 : 0,
        fy: isMobile ? 0 : 0,
        x: 147 + 93,
        y: (d) => 90 - d / 100 + 0.05,
        dx: 2,
        textAnchor: "middle",
        text: (d) => d,
        fill: "currentColor",
        stroke: "white",
        fontSize: 12,
        strokeWidth: 5,
      }),
    ],
  });

  return plot;
}
