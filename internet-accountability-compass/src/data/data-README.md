# Data Folder

## Data Loaders (R Scripts)

These scripts generate data files when Observable Framework runs:

- **dfiFull.csv.R** → Generates `dfiFull.csv` (full dataset with all indicators)
- **dfiCardinal.csv.R** → Generates `dfiCardinal.csv` (cardinal/pillar aggregated data)
- **worldMap.json.R** → Generates `worldMap.json` (GeoJSON with country data)
- **sources_csv.R** → Generates `sources.csv` (reference sources)

## Source Data Files

### Excel Files (Main Data)
- `Internet_Accountability_IndexV6.xlsx` - Main data source (2025 data)
- `Internet_Accountability_IndexV5.xlsx` - Previous version (keep for reference)

### GeoJSON Files (Map Boundaries)
These files are needed for map visualizations:

- **CNTR_RG_60M_2024_4326.json** - Country boundaries (2024, GISCO)
- **COAS_RG_60M_2016_4326.json** - Coastlines (2016, GISCO)
- **CNTR_RG_60M_2020_4326.json** - Country boundaries (2020, GISCO)
- **map.json** - Additional map data

**Source:** [GISCO - Eurostat's Geographic Information System](https://ec.europa.eu/eurostat/web/gisco/geodata/reference-data/administrative-units-statistical-units)

## How Data Loaders Work

When you run `npm run dev` or `npm run build`, Observable Framework:
1. Detects `.R` files with output extensions (e.g., `.csv.R`, `.json.R`)
2. Executes them using R
3. Caches the output in `.observablehq/cache/data/`
4. Makes the generated files available to your markdown pages

## Adding New Data Sources

To add a new data loader:
1. Create a file named `outputname.extension.R` (e.g., `mydata.csv.R`)
2. Make sure it outputs to stdout using `cat()`
3. Reference it in markdown with `FileAttachment("./data/outputname.extension")`

## Notes

- Data loaders run automatically when you start the dev server
- To force a reload, run `npm run clean` then `npm run dev`
- R must be installed with required packages (dplyr, tidyr, readr, readxl, sf, giscoR, etc.)
