// tell Observable Framework which country codes exist
// so Observable Framework needs to know which country pages to pre-generate at build time

import { csvParse } from "d3-dsv";
import { readFile } from "node:fs/promises";

// Read your full data to get all ISO3 codes
const dfiFull = csvParse(await readFile("src/data/dfiFull.csv", "utf-8"));

// Get unique ISO3 codes
const countries = [...new Set(dfiFull.map((d) => d.ISO3_CODE))].filter(Boolean);

// Return array of route objects
process.stdout.write(
  JSON.stringify(countries.map((iso3) => ({ country: iso3 }))),
);
