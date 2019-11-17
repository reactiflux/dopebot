import { ExecException } from "child_process";
import { Client, Message } from "discord.js";
import { config } from "dotenv";
import { of } from "rxjs";
import { filter, map, mergeMap, tap } from "rxjs/operators";
import { EVAL, HELP, JS, DESTRUCT, OWNER } from "./consts";
import {
  createExecObservable,
  discordObservable,
  throttleKey
} from "./observableHelpers";
import {
  addResultToLog,
  getFromResultLog,
  isInResultLog,
  removeFromResultLog
} from "./resultLog";

config();

const messageOptions = { code: "js" };
const bashOptions = { timeout: 2000, shell: "/bin/bash" };
const bashCommand = (code: string) =>
  `deno <( echo -e "['libdeno','deno','Deno','compilerMain'].forEach(p=>delete window[p]);console.log(eval(atob('${code}')))" )`;
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

type ThingResult = [
  ExecException | null,
  string | Buffer,
  string | Buffer,
  Message
];

const doTheThing = (message: Message) =>
  of(message).pipe(
    map(msg => msg.content.match(JS)),
    filter((matches): matches is RegExpMatchArray => Array.isArray(matches)),
    map(matches => matches[1]),
    map(code => Buffer.from(code).toString("base64")),
    map(bashCommand),
    mergeMap(createExecObservable(bashOptions)),
    map(result => [...result, message] as ThingResult)
  );

const client = new Client();

const message$ = discordObservable(client, "message");
const messageUpdate$ = discordObservable(client, "messageUpdate");
const messageDelete$ = discordObservable(client, "messageDelete");
const error$ = discordObservable(client, "error");

error$.subscribe(console.log);

message$
  .pipe(filter(message => HELP.test(message.content)))
  .subscribe(message => {
    message.channel.send(
      "I can eval your code if you send a message like\n?eval\n\\```js\nput your code here\n\\```\nMade a mistake? Edit your message and I'll edit my reply."
    );
  });

message$
  .pipe(
    filter(message => EVAL.test(message.content)),
    throttleKey(message => message.author.id, 30 * 1000),
    tap(message => {
      message.channel.startTyping();
    }),
    mergeMap(doTheThing)
  )
  .subscribe(([error, stdout, _stderr, message]) => {
    message.channel.stopTyping();
    (message.channel.send(
      formatResponse(error, stdout),
      messageOptions
    ) as Promise<Message>).then(addResultToLog(message.id));
  });

message$
  .pipe(
    filter(
      message => message.author.id === OWNER && DESTRUCT.test(message.content)
    )
  )
  .subscribe(message => {
    message.channel.send("GOOD BYE").then(() => {
      client.destroy();
      process.exit();
    });
  });

messageUpdate$
  .pipe(
    map(messages => messages[1]),
    filter(message => EVAL.test(message.content)),
    filter(message => isInResultLog(message.id)),
    tap(message => {
      message.channel.startTyping();
    }),
    mergeMap(doTheThing)
  )
  .subscribe(([error, stdout, _stderr, message]) => {
    message.channel.stopTyping();
    getFromResultLog(message.id)
      .edit(formatResponse(error, stdout), messageOptions)
      .then(addResultToLog(message.id));
  });

messageDelete$
  .pipe(
    map(message => message.id),
    filter(isInResultLog)
  )
  .subscribe(removeFromResultLog);

client.login(process.env.BOT_TOKEN).then(() => {
  client.user.setActivity("your code :robot: ?help", { type: "PLAYING" });
});
