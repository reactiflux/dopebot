import { humanizeTime } from "../humanizeTime";

test("humanizeTime", () => {
  expect(humanizeTime(1582887684597)).toBe(
    "18320 days, 11 hours, 1 minute, 24 seconds"
  );
});

test("humanizeTime", () => {
  expect(humanizeTime(-1582887684597)).toBe(
    "18320 days, 11 hours, 1 minute, 24 seconds"
  );
});

test("humanizeTime", () => {
  expect(humanizeTime(0)).toBe(
    "0 seconds"
  );
});

test("humanizeTime", () => {
  expect(humanizeTime(Number.POSITIVE_INFINITY)).toBe(
    "Infinity days"
  );
});

test("humanizeTime", () => {
  expect(humanizeTime(NaN)).toBe(
    "NaN seconds"
  );
});
