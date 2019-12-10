import { Client, Message } from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import { from, merge } from "rxjs";
import { delayWhen, filter, map, mergeMap } from "rxjs/operators";
import { promisify } from "util";
import {
  bashOptions,
  CODE,
  DESTRUCT,
  EVAL,
  FIVE_MINS,
  HELP,
  messageOptions,
  ONE_MIN,
  OWNER,
  THIRTY_SECS
} from "./consts";
import { formatResponse } from "./formatResponse";
import { fromDiscordEvent } from "./observables/fromDiscordEvent";
import { fromExec } from "./observables/fromExec";
import { throttleKey } from "./observables/throttleKey";
import {
  addResultToLog,
  getFromResultLog,
  isInResultLog,
  removeFromResultLog
} from "./resultLog";

const writeFile = promisify(fs.writeFile);
const deleteFile = promisify(fs.unlink);

config();

const client = new Client();

// ignore errors
fromDiscordEvent(client, "error").subscribe(() => {});

const message$ = fromDiscordEvent(client, "message");
const messageUpdate$ = fromDiscordEvent(client, "messageUpdate");
const messageDelete$ = fromDiscordEvent(client, "messageDelete");

message$
  .pipe(
    filter(message => HELP.test(message.content)),
    throttleKey(message => message.channel.id, ONE_MIN)
  )
  .subscribe(message => {
    message.channel.send(
      "I can eval your code if you send a message like\n?eval\n\\```js\nconsole.log('put your code here');\n\\```\nYou can edit or delete your messages! I also know TS!"
    );
  });

merge(
  message$.pipe(
    filter(message => EVAL.test(message.content)),
    throttleKey(message => message.author.id, THIRTY_SECS),
  ),
  messageUpdate$.pipe(
    filter(messages => messages[0].createdTimestamp > Date.now() - FIVE_MINS),
    map(messages => messages[1]),
    filter(message => EVAL.test(message.content)),
    throttleKey(message => message.author.id, THIRTY_SECS),
  )
)
  .pipe(
    map(messsage => ({
      message: messsage,
      matches: messsage.content.match(CODE)
    })),
    filter(
      (arg): arg is { message: Message; matches: RegExpMatchArray } =>
        arg.matches !== null
    ),
    map(({ message, matches: [, type, code] }) => ({
      message,
      type,
      code,
      fileName: `/tmp/${Date.now()}_${Math.random()}.${type}`
    })),
    delayWhen(({ fileName, code }) => from(writeFile(fileName, code))),
    mergeMap(({ message, fileName }) =>
      fromExec(`NO_COLOR=true deno ${fileName}`, bashOptions).pipe(
        map(result => ({
          message,
          fileName,
          result
        }))
      )
    ),
    delayWhen(({ fileName }) => from(deleteFile(fileName)))
  )
  .subscribe(({ message: { channel, id }, result: [error, output] }) => {
    if (isInResultLog(id)) {
      getFromResultLog(id)
        .edit(formatResponse(error, output as string), messageOptions)
        .then(addResultToLog(id));
    } else {
      (channel.send(
        formatResponse(error, output as string),
        messageOptions
      ) as Promise<Message>).then(addResultToLog(id));
    }
  });

messageDelete$
  .pipe(
    map(message => message.id),
    filter(isInResultLog)
  )
  .subscribe(removeFromResultLog);

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

client.login(process.env.BOT_TOKEN).then(() => {
  console.log(client.guilds.map(guild => ({ id: guild.id, name: guild.name })));
  client.user.setActivity("your code", { type: "PLAYING" });
});
