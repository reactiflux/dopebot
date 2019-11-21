import { ExecException } from "child_process";
import { Client, Message } from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { promisify } from "util";
import { DESTRUCT, EVAL, HELP, JS, OWNER, FIVE_MINS } from "./consts";
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

const writeFile = promisify(fs.writeFile);

config();

const messageOptions = { code: "ts" };
const bashOptions = { timeout: 5000, shell: "/bin/bash" };
const bashCommand = (fileName: string) => `NO_COLOR=true deno ${fileName}`;
const formatResponse = (
  error: ExecException | null,
  stdout: string | Buffer
) => {
  if (error && error.killed) {
    return "That took too long (5s)";
  }

  if (error) {
    return error.message
      .split(/\r?\n/)
      .filter(
        str => !str.startsWith("Command failed") && !str.includes("file:///")
      )
      .join("\n");
  }

  if (stdout.length === 0) {
    return "Got nothing! Make sure you console.log something"
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
    mergeMap(([,type, code]) => {
      const fileName = `/tmp/${Date.now()}_${Math.random()}.${type}`;
      return writeFile(fileName, code).then(() => fileName);
    }),
    map(bashCommand),
    mergeMap(createExecObservable(bashOptions)),
    map(result => [...result, message] as ThingResult)
  );

const client = new Client();

const message$ = discordObservable(client, "message");
const messageUpdate$ = discordObservable(client, "messageUpdate");
const messageDelete$ = discordObservable(client, "messageDelete");
const error$ = discordObservable(client, "error");

error$.subscribe(() => {});

message$
  .pipe(filter(message => HELP.test(message.content)))
  .subscribe(message => {
    message.channel.send(
      "I can eval your code if you send a message like\n?eval\n\\```js\nconsole.log('put your code here');\n\\```\nMade a mistake? Edit your message and I'll edit my reply."
    );
  });

message$
  .pipe(
    filter(message => EVAL.test(message.content)),
    throttleKey(message => message.author.id, 30 * 1000),
    mergeMap(doTheThing)
  )
  .subscribe(([error, stdout, _stderr, message]) => {
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
    filter(messages => messages[0].createdTimestamp > Date.now() - FIVE_MINS),
    map(messages => messages[1]),
    filter(message => EVAL.test(message.content)),
    filter(message => isInResultLog(message.id)),
    mergeMap(doTheThing)
  )
  .subscribe(([error, stdout, _stderr, message]) => {
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
  client.user.setActivity("your code", { type: "PLAYING" });
});
