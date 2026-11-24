const $ = (selector) => document.querySelector(selector);
const state = { place: { name: "Chengdu", country: "China", latitude: 30.5728, longitude: 104.0668 }, forecast: null };

const el = {
  dataState: $("#data-state"), liveState: $(".live-state"), search: $("#place-search"), searchButton: $("#search-place"),
  placeDetail: $("#place-detail"), placeResults: $("#place-results"), day: $("#day-select"), duration: $("#duration"),
  windowStart: $("#window-start"), windowEnd: $("#window-end"), referenceStart: $("#reference-start"), compare: $("#compare"),
  status: $("#status"), dayLabel: $("#day-label"), chart: $("#chart"),
  bestTime: $("#best-time"), bestDate: $("#best-date"), bestPm: $("#best-pm"), bestAqi: $("#best-aqi"),
  referenceTime: $("#reference-time"), referenceDate: $("#reference-date"), referencePm: $("#reference-pm"), referenceAqi: $("#reference-aqi"), difference: $("#difference")
};

function setStatus(message, error = false) {
  el.status.textContent = message;
  el.status.classList.toggle("error", error);
}

function clockMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatClock(minutes) {
  const value = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function dateLabel(date, options = { weekday: "short", month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: state.forecast.timezone }).format(new Date(`${date}T12:00:00`));
}

function datesFromForecast() {
  return [...new Set(state.forecast.hourly.time.map((stamp) => stamp.slice(0, 10)))];
}

async function fetchForecast() {
  el.compare.disabled = true;
  el.day.disabled = true;
  el.liveState.classList.remove("error", "ready");
  el.dataState.textContent = "Loading regional forecast";
  setStatus("Requesting hourly PM2.5 and US AQI…");
  const params = new URLSearchParams({
    latitude: String(state.place.latitude), longitude: String(state.place.longitude),
    hourly: "pm2_5,us_aqi", forecast_days: "3", timezone: "auto"
  });
  try {
    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    if (!response.ok) throw new Error(`Forecast service returned ${response.status}`);
    const data = await response.json();
    if (!data.hourly?.time?.length || !data.hourly?.pm2_5?.length) throw new Error("No hourly forecast was returned for this place.");
    state.forecast = data;
    const dates = datesFromForecast();
    el.day.replaceChildren(...dates.map((date, i) => new Option(i === 0 ? `Today · ${dateLabel(date)}` : dateLabel(date), date)));
    el.day.disabled = false;
    el.compare.disabled = false;
    el.liveState.classList.add("ready");
    el.dataState.textContent = `Forecast ready · ${data.timezone_abbreviation || data.timezone}`;
    drawResults();
  } catch (error) {
    el.liveState.classList.add("error");
    el.dataState.textContent = "Forecast unavailable";
    setStatus(`${error.message} Check your connection and try again.`, true);
  }
}

async function searchPlaces() {
  const query = el.search.value.trim();
  if (query.length < 2) {
    setStatus("Enter at least two letters for a city search.", true);
    return;
  }
  el.searchButton.disabled = true;
  el.placeResults.hidden = true;
  setStatus(`Searching places for “${query}”…`);
  try {
    const params = new URLSearchParams({ name: query, count: "6", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!response.ok) throw new Error(`Place search returned ${response.status}`);
    const data = await response.json();
    const results = data.results || [];
    if (!results.length) {
      setStatus("No matching city found. Try a more specific name.", true);
      return;
    }
    el.placeResults.replaceChildren(...results.map((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "place-option";
      button.setAttribute("role", "option");
      button.innerHTML = `${escapeHtml(place.name)}<span>${escapeHtml([place.admin1, place.country].filter(Boolean).join(", "))} · ${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}</span>`;
      button.addEventListener("click", () => {
        state.place = { name: place.name, country: place.country || "", latitude: place.latitude, longitude: place.longitude };
        el.search.value = place.name;
        el.placeDetail.textContent = `${place.name}${place.country ? `, ${place.country}` : ""} · ${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°`;
        el.placeResults.hidden = true;
        fetchForecast();
      });
      return button;
    }));
    el.placeResults.hidden = false;
    setStatus(`${results.length} matches. Select one to load its forecast.`);
  } catch (error) {
    setStatus(`${error.message} Check your connection and try again.`, true);
  } finally {
    el.searchButton.disabled = false;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function dayHours(date) {
  const indices = [];
  state.forecast.hourly.time.forEach((stamp, i) => { if (stamp.startsWith(date)) indices.push(i); });
  return indices.map((i) => ({
    time: state.forecast.hourly.time[i],
    pm25: state.forecast.hourly.pm2_5[i],
    aqi: state.forecast.hourly.us_aqi?.[i] ?? null
  }));
}

function drawChart(hours, reference, duration) {
  const canvas = el.chart;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  const width = rect.width, height = rect.height;
  const pad = { top: 8, right: 6, bottom: 14, left: 30 };
  const plotW = width - pad.left - pad.right, plotH = height - pad.top - pad.bottom;
  const values = hours.map((item) => item?.pm25).filter(Number.isFinite);
  if (!values.length) return;
  const max = Math.max(10, Math.ceil(Math.max(...values) / 10) * 10);
  ctx.clearRect(0, 0, width, height);
  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  for (let tick = 0; tick <= 2; tick++) {
    const value = max * tick / 2;
    const y = pad.top + plotH - plotH * tick / 2;
    ctx.strokeStyle = "#e3ebe7";
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    ctx.fillStyle = "#758680";
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(value)), pad.left - 7, y);
  }
  if (reference !== null) {
    const x = pad.left + (reference / 24) * plotW;
    const w = Math.max(2, (duration / 1440) * plotW);
    ctx.fillStyle = "#d49b5233";
    ctx.fillRect(x, pad.top, Math.min(w, width - pad.right - x), plotH);
    ctx.strokeStyle = "#bd7a2c";
    ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = "#218a68";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let hasPoint = false;
  hours.forEach((item, i) => {
    if (!item || !Number.isFinite(item.pm25)) return;
    const x = pad.left + (i / 23) * plotW;
    const y = pad.top + plotH - (item.pm25 / max) * plotH;
    if (!hasPoint) { ctx.moveTo(x, y); hasPoint = true; } else ctx.lineTo(x, y);
  });
  ctx.stroke();
  hours.forEach((item, i) => {
    if (!item || !Number.isFinite(item.pm25)) return;
    const x = pad.left + (i / 23) * plotW;
    const y = pad.top + plotH - (item.pm25 / max) * plotH;
    ctx.fillStyle = "#218a68"; ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2); ctx.fill();
  });
}

function drawResults() {
  if (!state.forecast) return;
  const date = el.day.value || datesFromForecast()[0];
  const hours = dayHours(date);
  const duration = Math.max(15, Math.min(180, Number(el.duration.value) || 30));
  el.duration.value = String(duration);
  const windowStart = clockMinutes(el.windowStart.value);
  const windowEnd = clockMinutes(el.windowEnd.value);
  const reference = clockMinutes(el.referenceStart.value);
  const best = windowEnd > windowStart && windowEnd - windowStart >= duration ? AirWindowModel.findBestWindow(hours, windowStart, windowEnd, duration) : null;
  const baseline = AirWindowModel.valueAcrossWindow(hours, reference, duration);
  el.dayLabel.textContent = dateLabel(date, { weekday: "long", month: "long", day: "numeric" });
  const at = dateLabel(date, { month: "short", day: "numeric" });
  if (!best) {
    setStatus("Set a daily window long enough to fit the activity.", true);
    el.bestTime.textContent = "—"; el.bestPm.textContent = "—"; el.bestAqi.textContent = "—";
  } else {
    el.bestTime.textContent = `${formatClock(best.start)}–${formatClock(best.start + duration)}`;
    el.bestDate.textContent = `${at} · ${duration} min`;
    el.bestPm.textContent = best.meanPm25.toFixed(1);
    el.bestAqi.textContent = Number.isFinite(best.highestAqi) ? Math.round(best.highestAqi) : "—";
    setStatus(`Compared ${(windowEnd - windowStart - duration) / 15 + 1} start times at 15-minute intervals.`);
  }
  el.referenceTime.textContent = `${formatClock(reference)}–${formatClock(reference + duration)}`;
  el.referenceDate.textContent = `${at} · ${duration} min`;
  el.referencePm.textContent = baseline ? baseline.meanPm25.toFixed(1) : "—";
  el.referenceAqi.textContent = baseline && Number.isFinite(baseline.highestAqi) ? Math.round(baseline.highestAqi) : "—";
  if (best && baseline) {
    const difference = baseline.meanPm25 - best.meanPm25;
    const percent = baseline.meanPm25 > 0 ? Math.max(0, difference / baseline.meanPm25 * 100) : 0;
    el.difference.textContent = difference > 0.05 ? `The lowest modeled window is ${percent.toFixed(0)}% lower than this reference.` : difference < -0.05 ? `This reference is lower than the lowest time in your chosen daily window.` : "Both windows are nearly equal in the current forecast.";
  } else el.difference.textContent = "Reference time is outside the available forecast.";
  drawChart(hours, reference, duration);
}

el.searchButton.addEventListener("click", searchPlaces);
el.search.addEventListener("keydown", (event) => { if (event.key === "Enter") searchPlaces(); });
el.day.addEventListener("change", drawResults);
el.compare.addEventListener("click", drawResults);
for (const input of [el.duration, el.windowStart, el.windowEnd, el.referenceStart]) input.addEventListener("change", drawResults);
window.addEventListener("resize", () => { if (state.forecast) drawResults(); });
document.addEventListener("click", (event) => { if (!event.target.closest(".controls")) el.placeResults.hidden = true; });

fetchForecast();
