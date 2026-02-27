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
    )

    # Read indicators (just once from 2025 sheet since they're the same)
    # We'll do this outside the function

    df_long <- df %>%
        select(Countries:`Total Index Score`, -contains("Total...")) %>%
        # make all numeric
        mutate(
            across(
                3:14,
                as.numeric
            )
        ) %>%
        # long form
        pivot_longer(
            3:14,
            names_to = "commitment_num",
            values_to = "value"
        ) %>%
        # keep commitment text
        mutate(
            commitment_txt = str_remove(commitment_num, " \\(new\\)"),
            commitment_txt = str_remove(commitment_txt, "Indicator ")
        ) %>%
        # slice indicator into pillar and commitment
        separate(
            commitment_txt,
            into = c("pillar_num", "commitment_num"),
            sep = "-",
            convert = TRUE
        ) %>%
        mutate(
            pillar_num = as.numeric(pillar_num),
            # substring b/c of FH header
            commitment_num = as.numeric(str_sub(commitment_num, 1, 2))
        ) %>%
        # detect not enough data comments
        mutate(
            note = ifelse(
                `Total Index Score` == "Not enough data",
                "Not enough data",
                NA
            ),
            `Total Index Score` = ifelse(
                `Total Index Score` == "Not enough data",
                NA,
                as.numeric(`Total Index Score`)
            ),
            # slice groups
            group = cut(`Total Index Score`,
                breaks = c(-Inf, 50, 65, 79, Inf),
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            group_value = cut(value,
                breaks = c(-Inf, 50, 65, 79, Inf),
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            # Add year column
            year = as.numeric(year_sheet)
        )

    return(df_long)
}

# Read indicators and cardinals from 2025 sheet (structure should be same across years)
indicators <- read_sheet(
    sheet_id,
    sheet = "2025",
    col_types = "c" # Read everything as character first, then convert
) %>%
    slice(1) %>%
    select(3:5, 7:9, 11:13, 15:17) %>%
    pivot_longer(1:12) %>%
    pull(value)

cardinals <- read_sheet(
    sheet_id,
    sheet = "2025", na = "NA"
) %>%
    names() %>%
    tibble() %>%
    rename(name = 1) %>%
    filter(!str_detect(name, "\\.")) %>%
    pull()

# Process all years and combine
df_all_years <- map_dfr(years, read_year)

# CLEAN COUNTRY NAMES ---------------------------------------

# replacement characters
replacements <- c("é" = "e", "ê" = "e", "à" = "a", "/" = "-")

df_rename <- df_all_years %>%
    # rename var names
    rename(
        NAME_ENGL = Countries,
        total = `Total Index Score`,
    )

dfi_clean <- df_rename %>%
    # drop values without total
    tidyr::drop_na(total) %>%
    # generate urls
    # mutate(country_url = paste0("countries/", str_to_lower(ISO3_CODE))) %>%
    # Adding a sequential count for commitments within each pillar
    group_by(year, pillar_num, commitment_num) %>%
    mutate(row_id = row_number()) %>% # Count rows within pillar-commitment pairs
    ungroup() %>%
    # sequential count for commitments within each pillar
    group_by(year, pillar_num) %>%
    mutate(x = cumsum(!duplicated(commitment_num))) %>%
    ungroup() %>%
    # adding some jitter to y for integer values
    mutate(y = jitter(value, amount = 2)) %>%
    arrange(year, NAME_ENGL) %>%
    # cardinal lookup
    mutate(
        pillar_num_cardinal = pillar_num,
        pillar_txt = case_match(
            pillar_num_cardinal,
            1 ~ cardinals[1],
            2 ~ cardinals[2],
            3 ~ cardinals[3],
            4 ~ cardinals[4]
        ),
        commitment_num_cardinal = commitment_num,
        commitment_txt_cardinal = case_match(
            commitment_num,
            1 ~ indicators[1],
            2 ~ indicators[2],
            3 ~ indicators[3],
            4 ~ indicators[4],
            5 ~ indicators[5],
            6 ~ indicators[6],
            7 ~ indicators[7],
            8 ~ indicators[8],
            9 ~ indicators[9],
            10 ~ indicators[10],
            11 ~ indicators[11],
            12 ~ indicators[12],
        )
    ) %>%
    group_by(year, NAME_ENGL) %>%
    # facets
    mutate(
        fx = (cur_group_id()) %% 5,
        fy = (cur_group_id()) %/% 5
    ) %>%
    ungroup() %>%
    arrange(year, NAME_ENGL, pillar_num_cardinal, commitment_num_cardinal)

cat(format_csv(dfi_clean))
