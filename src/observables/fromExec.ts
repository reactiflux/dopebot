import { ExecOptions, ExecException, exec } from "child_process";
import { fromEventPattern } from "rxjs";

export const fromExec = (execOptions: ExecOptions) => (
  command: string
) =>
  fromEventPattern<[ExecException | null, string | Buffer, string | Buffer]>(
    handler => exec(command, execOptions, handler)
  );
