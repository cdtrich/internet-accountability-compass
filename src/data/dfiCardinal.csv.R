library(dplyr)
library(tidyr)
library(readr)
library(readxl)
library(stringr)
library(googlesheets4)
library(purrr)

# READ ALL DATA FILES ---------------------------------------------------------

# Skip authentication for public/link-shareable sheets
gs4_deauth() # 2026-04-22

# Your Google Sheet ID (extracted from URL)
sheet_id <- "15_2sax_UIxuyDnvFvwQD3ZKi-h5IyzDxZCxXwwR-9xA"

# Define years to process
years <- c("2020", "2021", "2022", "2023", "2024", "2025")

# Function to read and process a single year
read_year <- function(year_sheet) {
    # Read full data including indicator columns
    df_full <- read_sheet(
        sheet_id,
        sheet = year_sheet,
        skip = 2,
        col_types = "c"
    )

    # Get pillar names from top header row (no "..." duplicates)
    names_header <- read_sheet(
        sheet_id,
        sheet = year_sheet,
        col_types = "c"
    ) %>%
        select(-contains("...")) %>%
        names()

    # --- Compute ned from individual indicators ---
    # Indicator columns are named "Indicator X-Y" where X is the pillar number
    indicator_cols <- names(df_full)[str_detect(names(df_full), "^Indicator")]

    ned_pillar <- df_full %>%
        select(ISO3_CODE, all_of(indicator_cols)) %>%
        mutate(across(all_of(indicator_cols), ~ suppressWarnings(as.numeric(.)))) %>%
        pivot_longer(all_of(indicator_cols), names_to = "indicator", values_to = "ind_value") %>%
        # Extract pillar number from "Indicator X-Y"
        mutate(pillar_num = as.integer(str_extract(indicator, "\\d+(?=-)"))) %>%
        group_by(ISO3_CODE, pillar_num) %>%
        summarise(ned = if_else(any(is.na(ind_value)), "Partial data", NA_character_), .groups = "drop") %>%
        mutate(pillar_txt = names_header[pillar_num]) %>%
        select(ISO3_CODE, pillar_txt, ned)

    # Total score: Partial data if any pillar has Partial data
    ned_total <- ned_pillar %>%
        group_by(ISO3_CODE) %>%
        summarise(ned = if_else(any(!is.na(ned)), "Partial data", NA_character_), .groups = "drop") %>%
        mutate(pillar_txt = "Total score")

    ned_all <- bind_rows(ned_pillar, ned_total)

    # --- Process pillar totals ---
    df <- df_full %>%
        select(Countries, ISO3_CODE, contains("Total..."), `Total Index Score`)

    # Assign pillar names to Total columns
    names(df)[3:6] <- names_header

    df_long <- df %>%
        pivot_longer(
            3:7,
            names_to = "pillar_txt",
            values_to = "value"
        ) %>%
        separate(value, into = c("value", "note"), sep = "\\*", extra = "merge") %>%
        mutate(
            value = suppressWarnings(as.numeric(value)),
            group_value = cut(value,
                breaks = c(-Inf, 50, 65, 79, Inf),
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            year = as.numeric(year_sheet),
            pillar_txt = if_else(pillar_txt == "Total Index Score", "Total score", pillar_txt)
        ) %>%
        left_join(ned_all, by = c("ISO3_CODE", "pillar_txt"))

    return(df_long)
}

# Process all years and combine
df_all_years <- map_dfr(years, read_year)

# CLEAN COUNTRY NAMES ---------------------------------------

# replacement characters
replacements <- c("é" = "e", "ê" = "e", "à" = "a", "/" = "-")

df_rename <- df_all_years %>%
    # rename var names
    rename(
        NAME_ENGL = Countries
    )

dfi_clean <- df_rename %>%
    # generate urls
    mutate(country_url = paste0("countries/", str_to_lower(ISO3_CODE))) %>%
    arrange(year, NAME_ENGL)

cat(format_csv(dfi_clean))
