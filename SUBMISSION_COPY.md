# UniHacks submission draft — AirWindow

## Project title
AirWindow

## Track
Clean Air

## Short description
AirWindow helps a school or community group compare possible start times for an outdoor activity using the same day's regional PM2.5 forecast. Set the place, activity length, and available schedule; the tool ranks 15-minute start times and shows the forecast values behind its comparison.

## Problem
An air-quality dashboard can show a number without helping a school compare two practical options, such as holding a short outdoor activity at noon or later in the day. AirWindow turns one forecast into a transparent schedule comparison while keeping the decision with the organizer.

## What it does
- Searches a city and fetches three days of hourly PM2.5 and US AQI forecast data.
- Lets a user choose a forecast day, activity duration, daily scheduling window, and reference start time.
- Compares candidate start times at 15-minute intervals using the time-weighted mean PM2.5 forecast.
- Shows the highest hourly US AQI that overlaps the block and charts the day's hourly PM2.5 values.
- Explains the model's regional resolution and limits; it does not give health advice or claim local sensor accuracy.

## How we would evaluate it
Use a captured real forecast response as input to the comparison function; independently calculate weighted means for a full-hour block and a block crossing an hour boundary. Verify that the ranking matches an exhaustive 15-minute enumeration, that missing forecast hours are not ranked, and that the displayed reference values match the source records. In a user study, ask school activity organizers to compare two schedules and explain the reason for their choice; do not claim behavior change or health benefit without such a study.

## AI use
AI-assisted coding was used to draft and debug parts of the interface and comparison implementation. AirWindow does not call an AI model at runtime. Before submission, the project owner should review the calculations, source attribution, and limitations.

## Data and credits
Forecasts: Open-Meteo Air Quality API, using CAMS model data. Place search: Open-Meteo Geocoding API. The app displays attribution and links to the source documentation.

## Limitations
The grid forecast is not a local sensor reading and can miss street-level variation. The PM2.5-duration proxy is not inhaled dose, personal exposure, or a clinical metric. US AQI is shown as context, not a guarantee of safety. The prototype does not incorporate official school policies, weather, indoor-air conditions, individual vulnerabilities, or direct user research.

## Required final materials
- Live demo URL: pending deployment.
- Source or design link: pending publication of this isolated project only.
- Demo video or screenshots: pending capture after UI and calculation tests.
