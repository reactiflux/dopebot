import { Client, Message } from "discord.js";
import { Observable, fromEventPattern } from "rxjs";
import { share, groupBy, mergeMap, throttleTime } from "rxjs/operators";
import { exec, ExecOptions, ExecException } from "child_process";

export interface DiscordObservable {
  (discordClient: Client, eventName: "message" | "messageDelete"): Observable<
    Message
  >;
  (discordClient: Client, eventName: "messageUpdate"): Observable<
    [Message, Message]
  >;
}

export const discordObservable: DiscordObservable = (
  discordClient: Client,
  eventName: string
): Observable<any> =>
  share()(fromEventPattern(discordClient.on.bind(discordClient, eventName)));

export const throttleKey = <Value>(
  keySelector: (value: Value) => any,
  duration: number
) => (observable: Observable<Value>) =>
  observable.pipe(
    groupBy(keySelector),
    mergeMap(obs => obs.pipe(throttleTime(duration)))
  );

type ExecResult = [ExecException | null, string | Buffer, string | Buffer];

type CreateExecObservable = (
  bashOptions: ExecOptions
) => (command: string) => Observable<ExecResult>;

export const createExecObservable: CreateExecObservable = bashOptions => command =>
  fromEventPattern(exec.bind(undefined, command, bashOptions) as any);
