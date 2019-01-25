import Discord from "discord.js";
import { exec, ExecException } from "child_process";
import { fromEventPattern, of, Observable } from "rxjs";
import {
  filter,
  groupBy,
  map,
  mergeMap,
  share,
  throttleTime,
  tap
} from "rxjs/operators";
import { config } from "dotenv";

config();

const JS = /`{3}js?([\s\S]*)`{3}/;
const HELP = /^\?h[ea]lp$/;
const EVAL = /^\?eval/;

interface DiscordObservable {
  (
    discordClient: Discord.Client,
    eventName: "message" | "messageDelete"
  ): Observable<Discord.Message>;
  (discordClient: Discord.Client, eventName: "messageUpdate"): Observable<
    [Discord.Message, Discord.Message]
  >;
}

const discordObservable: DiscordObservable = (
  discordClient: Discord.Client,
  eventName: string
): Observable<any> =>
  fromEventPattern(handler => discordClient.on(eventName, handler)).pipe(
    share()
  );

const throttleKey = <Value>(
  keySelector: (value: Value) => any,
  duration: number
) => (observable: Observable<Value>) =>
  observable.pipe(
    groupBy(keySelector),
    mergeMap(obs => obs.pipe(throttleTime(duration)))
  );

const messageOptions = { code: "js" };
const bashOptions = { timeout: 2000, shell: "/bin/bash" };
const bashCommand = (code: string) =>
  `deno <( echo -e "['libdeno','deno','compilerMain'].forEach(p=>delete window[p]);console.log(eval(atob('${code}')))" )`;
const formatResponse = (
  error: ExecException | null,
  stdout: string | Buffer
) => {
  if (error && error.killed) {
    return "That took too long (2s)";
  }

  if (error) {
    return error.message.split(/\r?\n/)[1];
  }

  if (stdout.length > 500) {
    return "tl;dr";
  }

  return stdout;
};

type ExecHandler = (
  error: ExecException | null,
  stdout: string | Buffer,
  stderr: string | Buffer
) => void;
type ThingResult = [
  ExecException | null,
  string | Buffer,
  string | Buffer,
  Discord.Message
];

const doTheThing = (message: Discord.Message) =>
  of(message).pipe(
    map(msg => msg.content.match(JS)),
    filter(
      (matches): matches is RegExpMatchArray =>
        Array.isArray(matches) && matches.length === 2
    ),
    map(matches => matches[1]),
    map(code => Buffer.from(code).toString("base64")),
    map(bashCommand),
    mergeMap(command =>
      fromEventPattern<
        [ExecException | null, string | Buffer, string | Buffer]
      >(handler => exec(command, bashOptions, handler as ExecHandler))
    ),
    map(result => [...result, message] as ThingResult)
  );

const client = new Discord.Client();

const message$ = discordObservable(client, "message");
const messageUpdate$ = discordObservable(client, "messageUpdate");
const messageDelete$ = discordObservable(client, "messageDelete");

const resultLog: { [id: string]: Discord.Message } = {};

const addResultToLog = (messageId: Discord.Snowflake) => (
  res: Discord.Message
) => {
  resultLog[messageId] = res;
};

const logToConsole = ([error, stdout, stderr, { content }]: ThingResult) => {
  console.log({ error, stdout, stderr, content });
};

message$
  .pipe(filter(message => HELP.test(message.content)))
  .subscribe(message => {
    message.channel.send(
      "Need some help evaluating your hacky code? Ooof. Send a message like\n?eval\n\\```js\nput your code here\n\\```"
    );
  });

message$
  .pipe(
    filter(message => EVAL.test(message.content)),
    throttleKey(message => message.author.id, 30 * 1000),
    mergeMap(doTheThing),
    tap(logToConsole)
  )
  .subscribe(([error, stdout, _stderr, message]) => {
    (message.channel.send(
      formatResponse(error, stdout),
      messageOptions
    ) as Promise<Discord.Message>).then(addResultToLog(message.id));
  });

messageUpdate$
  .pipe(
    map(messages => messages[1]),
    filter(message => EVAL.test(message.content)),
    filter(message => message.id in resultLog),
    mergeMap(doTheThing),
    tap(logToConsole)
  )
  .subscribe(([error, stdout, _stderr, message]) => {
    resultLog[message.id]
      .edit(formatResponse(error, stdout), messageOptions)
      .then(addResultToLog(message.id));
  });

messageDelete$
  .pipe(
    map(message => message.id),
    filter(messageId => messageId in resultLog)
  )
  .subscribe(messageId => {
    resultLog[messageId].delete();
    delete resultLog[messageId];
  });

client.login(process.env.BOT_TOKEN);
