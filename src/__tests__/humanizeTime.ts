import { humanizeTime } from "../humanizeTime";

test("humanizeTime", () => {
  expect(humanizeTime(1582887684597)).toBe(
    "18320 days, 11 hours, 1 minute, 24 seconds"
  );
});
