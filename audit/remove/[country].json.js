import { csvParse } from "d3-dsv";
import { readFile } from "node:fs/promises";

const dfiFull = csvParse(
  await readFile("src/.observablehq/cache/data/dfiFull.csv", "utf-8"),
);
const countries = [...new Set(dfiFull.map((d) => d.ISO3_CODE))]
  .filter(Boolean)
  .sort();

// Output as array of objects with 'country' key
process.stdout.write(
  JSON.stringify(countries.map((code) => ({ country: code }))),
);
