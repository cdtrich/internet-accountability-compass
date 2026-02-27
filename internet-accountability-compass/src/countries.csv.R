library(dplyr)
library(readr)
library(stringr)
library(here)

# Note: With ISO3-based routes, you don't need a separate countries.csv
# The route [country].md will extract ISO3 from the URL and find the country in dfiFull.csv

# However, if you want a reference list:
df <- read_csv(paste0(here(), "/src/.observablehq/cache/data/dfiFull.csv"))

# Get unique countries with their ISO3 codes
countries <- df %>%
  distinct(NAME_ENGL, ISO3_CODE) %>%
  arrange(NAME_ENGL)

# Output as CSV (optional - not required for routing)
cat(format_csv(countries))
