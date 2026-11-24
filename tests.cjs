const assert = require("node:assert/strict");
const { valueAcrossWindow, findBestWindow } = require("./model.js");

async function main() {
  const url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.5728&longitude=104.0668&hourly=pm2_5,us_aqi&forecast_days=3&timezone=Asia%2FShanghai";
  const response = await fetch(url);
  assert.equal(response.ok, true, `forecast API status ${response.status}`);
  const data = await response.json();
  assert.equal(data.hourly.time.length, 72, "three forecast days should provide 72 hourly timestamps");
  assert.equal(data.hourly.pm2_5.length, 72);

  const day = data.hourly.time[0].slice(0, 10);
  const points = data.hourly.time.map((time, i) => ({ time, pm25: data.hourly.pm2_5[i], aqi: data.hourly.us_aqi[i] })).filter((item) => item.time.startsWith(day));
  assert.equal(points.length, 24);
  const crossingHour = valueAcrossWindow(points, 8 * 60 + 45, 45);
  assert.ok(crossingHour, "a complete real-data interval crossing an hour boundary should be measurable");
  const expected = (points[8].pm25 * 15 + points[9].pm25 * 30) / 45;
  assert.ok(Math.abs(crossingHour.meanPm25 - expected) < 1e-9, "weighted mean must apportion minutes across both hours");
  assert.equal(crossingHour.highestAqi, Math.max(points[8].aqi, points[9].aqi));

  const best = findBestWindow(points, 8 * 60, 17 * 60, 30);
  assert.ok(best, "the selected school-day window should yield a candidate");
  const exhaustive = [];
  for (let start = 8 * 60; start + 30 <= 17 * 60; start += 15) {
    const metric = valueAcrossWindow(points, start, 30);
    if (metric) exhaustive.push({ start, ...metric });
  }
  exhaustive.sort((a, b) => a.meanPm25 - b.meanPm25 || a.start - b.start);
  assert.equal(best.start, exhaustive[0].start, "ranked window must match exhaustive 15-minute enumeration");
  assert.ok(Number.isFinite(best.meanPm25) && best.meanPm25 >= 0);

  console.log(JSON.stringify({
    source: "live Open-Meteo/CAMS forecast",
    date: day,
    intervalMean: Number(crossingHour.meanPm25.toFixed(3)),
    candidates: exhaustive.length,
    lowestStart: `${String(Math.floor(best.start / 60)).padStart(2, "0")}:${String(best.start % 60).padStart(2, "0")}`,
    lowestMeanPm25: Number(best.meanPm25.toFixed(3)),
    result: "PASS"
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
