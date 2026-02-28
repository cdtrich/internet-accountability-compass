library(readxl)
library(dplyr)
library(readr)
library(here)

# Read the Excel file
df <- read_excel(paste0(here(), "/src/data/Internet_Accountability_IndexV6.xlsx"))

# Get only the latest year
latest_year <- max(df$year, na.rm = TRUE)
df_latest <- df %>% filter(year == latest_year)

# Output as CSV
cat(format_csv(df_latest))
