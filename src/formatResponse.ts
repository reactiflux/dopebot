import { ExecException } from "child_process";
import { COLOR_TAGS } from "./consts";

export const formatResponse = (error: ExecException | null, output: string) => {
  if (error && error.killed) {
    return "That took too long (5s)";
  }

  if (error) {
    return error.message
      .replace(COLOR_TAGS, "")
      .split(/\r?\n/)
      .filter(
        str => !str.startsWith("Command failed") && !str.includes("file:///")
      )
      .join("\n");
  }

  if (output.length === 0) {
    return "Got nothing! Make sure you `console.log` something";
  }

  if (output.length > 500) {
    return "tl;dr";
  }

  return output;
};
