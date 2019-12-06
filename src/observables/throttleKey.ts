import { Observable } from "rxjs";
import { groupBy, mergeMap, throttleTime } from "rxjs/operators";

export const throttleKey = <Value>(
  keySelector: (value: Value) => any,
  duration: number
) => (observable: Observable<Value>) =>
  observable.pipe(groupBy(keySelector), mergeMap(throttleTime(duration)));
