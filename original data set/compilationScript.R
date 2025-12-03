library(dplyr)
library(readr)

races <- read_csv("races.csv") %>% select(raceId, year, circuitId, name) %>% rename(circuitName = name)
drivers <- read_csv("drivers.csv") %>% select(driverId, forename, surname)
race <- read.csv("results.csv") %>% select(raceId, driverId, grid, position, constructorId) 
constructors <- read.csv("constructors.csv") %>% select(constructorId, name) %>% rename(constructorName = name)

f1_joined <- race %>%
  inner_join(races, by = "raceId") %>%
  
  inner_join(drivers, by = "driverId") %>%
  
  inner_join(constructors, by = "constructorId") %>%
  
  mutate(driverName = paste(forename, surname)) %>%
  
  select(
    raceId, year, circuitName, driverName, constructorName, grid, position
  ) %>%
  group_by(
    raceId,
    year,
    circuitName,
    constructorName,
    grid,
    position
  ) %>%
  summarise(
    driverName = paste(driverName, collapse = " / "),
    .groups = "drop"
  )

write_csv(f1_joined, "f1_grid_race_comp.csv")
