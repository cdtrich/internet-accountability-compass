library(dplyr)
library(readr)
library(stringr)
library(here)

# Read the country data to get country list
df <- read_csv(paste0(here(), "/src/.observablehq/cache/data/dfiFull.csv"))

# Get unique countries
countries <- df %>%
  distinct(NAME_ENGL, ISO3_CODE) %>%
  arrange(NAME_ENGL)

# Read the template
template <- read_file(paste0(here(), "/src/1countryPageTemplate.md"))

# Generate a page for each country
for (i in 1:nrow(countries)) {
  country_name <- countries$NAME_ENGL[i]
  country_iso <- countries$ISO3_CODE[i]

  # Replace placeholder with actual country ISO code
  page_content <- str_replace_all(template, "COUNTRY_ISO_PLACEHOLDER", country_iso)

  # Create directory FIRST
  country_dir <- paste0(here(), "/src/", country_iso)
  dir.create(country_dir, showWarnings = FALSE)

  # Write the page
  write_file(
    page_content,
    paste0(country_dir, "/index.md")
  )

  cat("Generated page for", country_name, "(", country_iso, ")\n")
}

cat("\nGenerated", nrow(countries), "country pages\n")
