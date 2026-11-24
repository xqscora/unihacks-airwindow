# AirWindow

AirWindow is a browser-based planning prototype for schools and community groups. It compares possible start times for a short outdoor activity against an hourly regional PM2.5 forecast.

## Run locally

Open `index.html` in a modern browser, or serve this directory over HTTP:

```powershell
python -m http.server 8518
```

The app requests three days of hourly PM2.5 and US AQI data from the Open-Meteo Air Quality API. City search uses Open-Meteo Geocoding. No account or API key is required for the non-commercial prototype. A network connection is required.

Run the live-data calculation checks with `node tests.cjs`. The checks fetch the current Chengdu forecast directly and verify weighted intervals that cross an hour boundary plus the 15-minute schedule ranking.

## What the comparison means

For each start time, AirWindow computes the time-weighted mean forecast PM2.5 over the selected activity duration, then ranks 15-minute start increments within the chosen daily window. It shows the highest hourly US AQI overlapping each block as additional context. The reference block lets a user compare a familiar schedule with the lowest modeled window.

The displayed proxy is `mean forecast PM2.5 × activity minutes`. It is a schedule-comparison quantity only. It is not a measured personal exposure, inhaled dose, health-risk estimate, or medical recommendation. Forecasts are regional model output and can differ from street-level conditions. Users should check official local advisories and make their own decisions.

## Data attribution

Air-quality data is provided through [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api), using Copernicus Atmosphere Monitoring Service (CAMS) model data. Open-Meteo requires attribution to both Open-Meteo and the CAMS data provider; see its [API documentation](https://open-meteo.com/en/docs/air-quality-api) and [terms](https://open-meteo.com/en/terms). Place search uses [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api).

## Scope

This is a student planning prototype, not an official air-quality service. It does not store search history, infer sensitive health attributes, personalize medical advice, or claim that shifting an activity makes it safe.
