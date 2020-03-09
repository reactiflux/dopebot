const SECONDS = 1000;
const MINUTES = SECONDS * 60;
const HOURS = MINUTES * 60;
const DAYS = HOURS * 24;

const words = ["day", "hour", "minute", "second"];

const values = [DAYS, HOURS, MINUTES, SECONDS];

export const humanizeTime = (ms: number) =>
  values
    .map((value, index, arr) =>
      Math.floor(
        arr.slice(0, index).reduce((acc, cur) => acc % cur, ms) / value
      )
    )
    .map(
      (time, index) => time && `${time} ${words[index]}${time === 1 ? "" : "s"}`
    )
    .filter(Boolean)
    .join(", ");
