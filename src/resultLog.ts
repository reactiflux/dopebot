import { Message, Snowflake } from "discord.js";

export type AddResultToLog = (messageId: Snowflake) => (res: Message) => void;
export type IsInResultLog = (messageId: Snowflake) => boolean;
export type RemoveFromResultLog = (messageId: Snowflake) => void;
export type getFromResultLog = (messageId: Snowflake) => Message;

const resultLog: { [id: string]: Message } = {};

export const addResultToLog: AddResultToLog = messageId => res => {
  resultLog[messageId] = res;
};

export const isInResultLog: IsInResultLog = messageId => messageId in resultLog;

export const removeFromResultLog: RemoveFromResultLog = messageId => {
  resultLog[messageId].delete();
  delete resultLog[messageId];
};

export const getFromResultLog: getFromResultLog = messageId =>
  resultLog[messageId];
