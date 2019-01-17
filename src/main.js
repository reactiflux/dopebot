const Discord = require("discord.js");
const { exec } = require("child_process");
require("dotenv").config();

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const regex = /`{3}js?([\s\S]*)`{3}/;

let lastmessage = 0;

client.on("message", msg => {
  try {
    if (msg.content.startsWith("?eval")) {
      const matches = msg.content.match(regex);
      if (matches == null || matches.length !== 2) return;
      if ((Date.now() - lastmessage) < (1000 * 30)) return;
      lastmessage = Date.now();
      const base64data = Buffer.from(matches[1]).toString("base64");

      exec(
        `deno <( echo -e "['libdeno','deno','compilerMain'].forEach(p=>delete window[p]);console.log(eval(window.atob('${base64data}')))" )`,
        { timeout: 2000, shell: "/bin/bash" },
        (error, stdout, stderr) => {
          console.log(error, stdout, stderr);
          if (error) {
            msg.channel.send(
              error.killed
                ? "Too long; didn't run"
                : error.message.split(/\r?\n/)[1]
            );
          } else {
            const message = stderr.length ? stderr : stdout;
            if (message.length > 500) {
              msg.channel.send("tl;dr");
            } else {
              msg.channel.send(message, { code: "ts" });
            }
          }
        }
      );
    }
  } catch (e) {
    console.log(e);
  }
});

client.login(process.env.BOT_TOKEN);
