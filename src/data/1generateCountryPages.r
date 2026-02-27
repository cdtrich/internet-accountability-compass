# javascript might be better!!!
# https://dev.to/jameswallis/combining-markdown-and-dynamic-routes-to-make-a-more-maintainable-next-js-website-3ogl

library(dplyr)
library(readr)
library(stringr)
library(foreach)
# library(googlesheets4)

# generateCountryPages
# getwd()
# go up one folder
# setwd("..")

data <- read_csv("src/.observablehq/cache/data/dfiFull.csv") %>%
    print()

country <- data %>%
    distinct(NAME_ENGL) %>%
    pull()
# country[119]

country_url <- data %>%
    distinct(ISO3_CODE, .keep_all = TRUE) %>%
    pull(country_url)

# country_url_source <- country_url %>%
#     str_remove(".")

# read md template
breakFun <- function(x) {
    # function to replace empty lines with newline.
    if (nchar(x) == 0) {
        return("\n\n") # double newline to give same space as in the .md-file
    } else {
        return(x)
    }
}

storeLines <- readLines("src/countries/1countryPageTemplate.md")

foreach(i = 1:length(country)) %do% {
    cleanLines <- storeLines %>%
        str_replace_all("cntr", country[i])

    countryLines <- cleanLines %>%
        # paste0(lapply(storeLines, FUN = function(x) breakFun(x)), collapse = "") %>%
        str_replace_all("cntr", country[i])

    write_lines(
        countryLines,
        paste0("src/", country_url[i], ".md")
    )
    print(paste0(country[i], " (", i, "/", length(country), ") written to file."))
}
