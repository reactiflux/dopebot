import { of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { fromExec } from "../fromExec";

describe("fromExec", () => {
  it("should execute bash commands", async () => {
    const [, text] = await of("apt help")
      .pipe(mergeMap(fromExec({ shell: "/bin/bash" })))
      .toPromise();

    expect(text).toContain("This APT has Super Cow Powers.");
  });

  it("should gracefully report errors", async () => {
    const [, , output] = await of(
      "NO_COLOR=true deno <( echo 'console.bog(2 + 2)' ) "
    )
      .pipe(mergeMap(fromExec({ shell: "/bin/bash" })))
      .toPromise();

    expect(output).toContain(
      "error: Uncaught TypeError: console.bog is not a function"
    );
  });
});
