import { csvParse } from "d3-dsv";
import { readFile } from "node:fs/promises";

// Read dfiFull from cache (where the R loader puts it)
const dfiFull = csvParse(
  await readFile("src/.observablehq/cache/data/dfiFull.csv", "utf-8"),
);

// Get unique ISO3 codes
const countries = [...new Set(dfiFull.map((d) => d.ISO3_CODE))]
  .filter(Boolean)
  .sort();

// Output as JSON array
process.stdout.write(JSON.stringify(countries));
