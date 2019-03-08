import { Client } from "discord.js";
import { Observable, fromEventPattern } from "rxjs";
import { share, groupBy, mergeMap, throttleTime } from "rxjs/operators";
import { exec, ExecOptions, ExecException } from "child_process";
import { DiscordEventMap } from "./DiscordEventMap";

export const discordObservable = <Event extends keyof DiscordEventMap>(
  discordClient: Client,
  eventName: Event
): Observable<DiscordEventMap[Event]> =>
  fromEventPattern<DiscordEventMap[Event]>(handler =>
    discordClient.on(eventName, handler)
  ).pipe(share());

export const throttleKey = <Value>(
  keySelector: (value: Value) => any,
  duration: number
) => (observable: Observable<Value>) =>
  observable.pipe(
    groupBy(keySelector),
    mergeMap(obs => obs.pipe(throttleTime(duration)))
  );

export const createExecObservable = (execOptions: ExecOptions) => (
  command: string
) =>
  fromEventPattern<[ExecException | null, string | Buffer, string | Buffer]>(
    handler => exec(command, execOptions, handler)
  );
