const Discord = require("discord.js");
const { exec } = require("child_process");
const { fromEventPattern, of } = require("rxjs");
const {
  filter,
  groupBy,
  map,
  mergeMap,
  share,
  tap,
  throttleTime
} = require("rxjs/operators");
require("dotenv").config();

const client = new Discord.Client();
const regex = /`{3}js?([\s\S]*)`{3}/;

const message$ = fromEventPattern(handler => {
  client.on("message", handler);
}).pipe(share());

message$
  .pipe(filter(message => /^\?h[ea]lp$/.test(message.content)))
  .subscribe(message => {
    message.channel.send(
      "Need some help evaluating your hacky code? Ooof. Send a message like\n?eval\n\\```js\nput your code here\n\\```"
    );
  });

message$
  .pipe(
    filter(message => /^\?eval/.test(message.content)),
    groupBy(message => message.author.id),
    mergeMap(msg$ => msg$.pipe(throttleTime(30 * 1000))),
    mergeMap(message =>
      of(message).pipe(
        map(msg => msg.content.match(regex)),
        filter(matches => Array.isArray(matches) && matches.length === 2),
        map(matches => matches[1]),
        map(code => Buffer.from(code).toString("base64")),
        mergeMap(encoded =>
          fromEventPattern(handler => {
            exec(
              `deno <( echo -e "['libdeno','deno','compilerMain'].forEach(p=>delete window[p]);console.log(eval(window.atob('${encoded}')))" )`,
              { timeout: 2000, shell: "/bin/bash" },
              handler
            );
          })
        ),
        map(result => result.concat(message))
      )
    ),
    tap(console.log)
  )
  .subscribe(
    ([error, stdout, stderr, message]) => {
      const res = stderr.length ? stderr : stdout;

      if ((error && error.killed) || res.length > 500) {
        message.channel.send("tl;dr");
        return;
      }

      message.channel.send(error ? error.message.split(/\r?\n/)[1] : res, {
        code: "js"
      });
    },
    error => {
      console.log(error);
    }
  );

client.login(process.env.BOT_TOKEN);
