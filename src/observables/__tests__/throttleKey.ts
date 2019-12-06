import { throttleKey } from "../throttleKey";
import { TestScheduler } from "rxjs/testing";

const testScheduler = new TestScheduler((actual: any, expected: any) => {
  expect(actual).toEqual(expected);
});

describe("throttleKey", () => {
  it("should throttle based on a key selector", () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const messages = {
        a: { value: "a", author: { id: 1234 } },
        b: { value: "b", author: { id: 1234 } },
        c: { value: "c", author: { id: 1234 } },
        d: { value: "d", author: { id: 1234 } },
        e: { value: "e", author: { id: 12345 } },
        f: { value: "f", author: { id: 12345 } }
      };
      expectObservable(
        cold("a-b-c-d-e-f|", messages).pipe(
          throttleKey(message => message.author.id, 5)
        )
      ).toBe("a-----d-e--|", messages);
    });
  });
});
