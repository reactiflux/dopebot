import { exec, ExecException, ExecOptions } from "child_process";
import { bindCallback } from "rxjs";

export const fromExec = (execOptions: ExecOptions) => (command: string) =>
  bindCallback<ExecException | null, string | Buffer, string | Buffer>(
    handler => exec(command, execOptions, handler)
  )();
