library(dplyr)
library(tidyr)
library(readr)
library(readxl)
library(stringr)
library(googlesheets4)
library(purrr)

# READ ALL DATA FILES ---------------------------------------------------------

# Skip authentication for public/link-shareable sheets
gs4_deauth()

# Your Google Sheet ID (extracted from URL)
sheet_id <- "15_2sax_UIxuyDnvFvwQD3ZKi-h5IyzDxZCxXwwR-9xA"

# Define years to process
years <- c("2020", "2021", "2022", "2023", "2024", "2025")

# Function to read and process a single year
read_year <- function(year_sheet) {
    # Read the data
    df <- read_sheet(
        sheet_id,
        sheet = year_sheet,
        skip = 2,
        col_types = "c" # Read everything as character first, then convert
    ) %>%
        select(Countries, ISO3_CODE, contains("Total..."), `Total Index Score`)

    # Get column names from header row
    names_header <- read_sheet(
        sheet_id,
        sheet = year_sheet,
        col_types = "c" # Read everything as character first, then convert
    ) %>%
        select(-contains("...")) %>%
        names()

    # Assign pillar names to Total columns
    names(df)[3:6] <- names_header

    df_long <- df %>%
        # long form
        pivot_longer(
            3:7,
            names_to = "pillar_txt",
            values_to = "value"
        ) %>%
        separate(value, into = c("value", "note"), sep = "\\*", extra = "merge") %>%
        # make all numeric
        # detect not enough data comments
        mutate(
            ned = ifelse(
                str_detect(value, "ot enough data"),
                "not enough data",
                NA
            ),
            value = ifelse(
                str_detect(value, "ot enough data"),
                NA,
                as.numeric(value)
            ),
            group_value = cut(value,
                breaks = c(-Inf, 50, 65, 79, Inf),
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            # Add year column
            year = as.numeric(year_sheet),
            # rename total value
            pillar_txt = ifelse(pillar_txt == "Total Index Score",
                "Total score", pillar_txt
            )
        )

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
