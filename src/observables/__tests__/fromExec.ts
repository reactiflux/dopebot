import { fromExec } from "../fromExec";

describe("fromExec", () => {
  it("should execute bash commands", async () => {
    const [, text] = await fromExec("apt help", {
      shell: "/bin/bash"
    }).toPromise();

    expect(text).toContain("This APT has Super Cow Powers.");
  });

  it("should gracefully report errors", async () => {
    const [
      ,
      ,
      output
    ] = await fromExec("NO_COLOR=true deno <( echo 'console.bog(2 + 2)' ) ", {
      shell: "/bin/bash"
    }).toPromise();

    expect(output).toContain(
      "error: Uncaught TypeError: console.bog is not a function"
    );
  });
});
