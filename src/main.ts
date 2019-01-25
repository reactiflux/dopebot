const Discord = require("discord.js");
const { exec } = require("child_process");
const { fromEventPattern, of } = require("rxjs");
const {
  filter,
  groupBy,
  map,
  mergeMap,
  share,
  throttleTime,
  tap,
  pluck
} = require("rxjs/operators");
require("dotenv").config();

const JS = /`{3}js?([\s\S]*)`{3}/;
const HELP = /^\?h[ea]lp$/;
const EVAL = /^\?eval/;

const discordObservable = (discordClient, eventName) =>
  share()(fromEventPattern(discordClient.on.bind(discordClient, eventName)));
const throttleKey = (keySelector, duration) => observable =>
  mergeMap(obs => obs.pipe(throttleTime(duration)))(
    groupBy(keySelector)(observable)
  );

const messageOptions = { code: "js" };
const bashOptions = { timeout: 2000, shell: "/bin/bash" };
const bashCommand = code =>
  `deno <( echo -e "['libdeno','deno','compilerMain'].forEach(p=>delete window[p]);console.log(eval(atob('${code}')))" )`;
const formatResponse = (error, stdout) => {
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
const doTheThing = message =>
  of(message).pipe(
    map(msg => msg.content.match(JS)),
    filter(matches => Array.isArray(matches) && matches.length === 2),
    map(matches => matches[1]),
    map(code => Buffer.from(code).toString("base64")),
    map(bashCommand),
    mergeMap(command =>
      fromEventPattern(exec.bind(undefined, command, bashOptions))
    ),
    map(result => result.concat(message))
  );

const client = new Discord.Client();

const message$ = discordObservable(client, "message");
const messageUpdate$ = discordObservable(client, "messageUpdate");
const messageDelete$ = discordObservable(client, "messageDelete");

const resultLog = {};

const addResultToLog = messageId => res => {
  resultLog[messageId] = res;
};

const logToConsole = ([error, stdout, stderr, { content }]) => {
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
    message.channel
      .send(formatResponse(error, stdout), messageOptions)
      .then(addResultToLog(message.id));
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
    pluck("id"),
    filter(messageId => messageId in resultLog)
  )
  .subscribe(messageId => {
    resultLog[messageId].delete();
    delete resultLog[messageId];
  });

client.login(process.env.BOT_TOKEN);
