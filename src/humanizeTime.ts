const SECONDS = 1000;
const MINUTES = SECONDS * 60;
const HOURS = MINUTES * 60;
const DAYS = HOURS * 24;

const words = ["day", "hour", "minute", "second"];

export const humanizeTime = (ms: number) =>
  [
    Math.floor(ms / DAYS),
    Math.floor((ms % DAYS) / HOURS),
    Math.floor(((ms % DAYS) % HOURS) / MINUTES),
    Math.floor((((ms % DAYS) % HOURS) % MINUTES) / SECONDS)
  ]
    .map(
      (time, index) => time && `${time} ${words[index]}${time === 1 ? "" : "s"}`
    )
    .filter(Boolean)
    .join(", ");
