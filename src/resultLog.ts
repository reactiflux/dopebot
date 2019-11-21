import { Message, Snowflake } from "discord.js";
import { FIVE_MINS } from "./consts";

export type AddResultToLog = (messageId: Snowflake) => (res: Message) => void;
export type IsInResultLog = (messageId: Snowflake) => boolean;
export type RemoveFromResultLog = (messageId: Snowflake) => void;
export type getFromResultLog = (messageId: Snowflake) => Message;

const resultLog: { [id: string]: Message } = {};

const clearResultLog = () => {
  for (let key in resultLog) {
    delete resultLog[key];
  }
}

const debounce = (delay: number, fn: () => void) => {
  let timer: NodeJS.Timeout | undefined;
  
  return () => {
    if (timer) {
      global.clearTimeout(timer);
      timer = undefined;
    }
    timer = global.setTimeout(fn, delay)
  }
}

const clearResultLogDebounced = debounce(FIVE_MINS, clearResultLog);

export const addResultToLog: AddResultToLog = messageId => res => {
  resultLog[messageId] = res;
  clearResultLogDebounced();
};

export const isInResultLog: IsInResultLog = messageId => messageId in resultLog;

export const removeFromResultLog: RemoveFromResultLog = messageId => {
  resultLog[messageId].delete();
  delete resultLog[messageId];
};

export const getFromResultLog: getFromResultLog = messageId =>
  resultLog[messageId];
