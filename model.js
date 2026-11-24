function valueAcrossWindow(hours, startMinute, duration) {
  let weighted = 0;
  let covered = 0;
  let highestAqi = null;
  for (let minute = startMinute; minute < startMinute + duration; minute += 15) {
    const item = hours[Math.floor(minute / 60)];
    if (!item || !Number.isFinite(item.pm25)) return null;
    const segment = Math.min(15, startMinute + duration - minute);
    weighted += item.pm25 * segment;
    covered += segment;
    if (Number.isFinite(item.aqi)) highestAqi = highestAqi === null ? item.aqi : Math.max(highestAqi, item.aqi);
  }
  return { meanPm25: weighted / covered, highestAqi, proxy: weighted };
}

function findBestWindow(hours, start, end, duration) {
  const candidates = [];
  for (let minute = start; minute + duration <= end; minute += 15) {
    const metric = valueAcrossWindow(hours, minute, duration);
    if (metric) candidates.push({ start: minute, ...metric });
  }
  candidates.sort((a, b) => a.meanPm25 - b.meanPm25 || a.start - b.start);
  return candidates[0] || null;
}

const AirWindowModel = { valueAcrossWindow, findBestWindow };
if (typeof module !== "undefined" && module.exports) module.exports = AirWindowModel;
if (typeof window !== "undefined") window.AirWindowModel = AirWindowModel;
