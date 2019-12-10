import { Client } from "discord.js";
import { Observable, fromEventPattern } from "rxjs";
import { share } from "rxjs/operators";
import { DiscordEventMap } from "./DiscordEventMap";

export const fromDiscordEvent = <Event extends keyof DiscordEventMap>(
  discordClient: Client,
  eventName: Event
): Observable<DiscordEventMap[Event]> =>
  fromEventPattern<DiscordEventMap[Event]>(
    handler => discordClient.on(eventName, handler),
    handler => discordClient.off(eventName, handler)
  ).pipe(share());
