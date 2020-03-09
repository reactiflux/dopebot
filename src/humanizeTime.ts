const SECONDS = 1000;
const MINUTES = SECONDS * 60;
const HOURS = MINUTES * 60;
const DAYS = HOURS * 24;

const words = ["day", "hour", "minute", "second"];

const values = [DAYS, HOURS, MINUTES, SECONDS];

const mod = (a: number, b: number) => a % b;

const flow = (...fns: ((input: any) => any)[]) => (value: any) =>
  fns.reduce((acc, cur) => cur(acc), value);

const reduce = (fn: (acc: any, cur: any) => any, init: any) => (arr: any[]) =>
  arr.reduce(fn, init);

const devideBy = (b: number) => (a: number) => a / b;

const slice = (start: number, end: number) => (arr: any[]) =>
  arr.slice(start, end);

export const humanizeTime = (ms: number) =>
  values
    .map((value, index, arr): number =>
      flow(
        slice(0, index),
        reduce(mod, Math.abs(ms)),
        devideBy(value),
        Math.floor
      )(arr)
    )
    .reduce((acc, time, index, arr) => {
      if (time > 0 || (acc.length === 0 && arr.length === index + 1)) {
        acc.push(`${time} ${words[index]}${time === 1 ? "" : "s"}`);
      }

      return acc;
    }, [] as string[])
    .join(", ");
