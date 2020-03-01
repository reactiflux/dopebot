import {
  Channel,
  Message,
  Emoji,
  Guild,
  User,
  GuildMember,
  Collection,
  Snowflake,
  MessageReaction,
  Role,
  UserResolvable
} from "discord.js";

export interface DiscordEventMap {
  channelCreate: Channel;
  channelDelete: Channel;
  channelPinsUpdate: [Channel, Date];
  channelUpdate: [Channel, Channel];
  debug: string;
  disconnect: any;
  emojiCreate: Emoji;
  emojiDelete: Emoji;
  emojiUpdate: [Emoji, Emoji];
  error: Error;
  guildBanAdd: [Guild, User];
  guildBanRemove: [Guild, User];
  guildCreate: Guild;
  guildDelete: Guild;
  guildMemberAdd: GuildMember;
  guildMemberAvailable: GuildMember;
  guildMemberRemove: GuildMember;
  guildMembersChunk: [GuildMember[], Guild];
  guildMemberSpeaking: [GuildMember, boolean];
  guildMemberUpdate: [GuildMember, GuildMember];
  guildUnavailable: Guild;
  guildUpdate: [Guild, Guild];
  message: Message;
  messageDelete: Message;
  messageDeleteBulk: Collection<Snowflake, Message>;
  messageReactionAdd: [MessageReaction, User];
  messageReactionRemove: [MessageReaction, User];
  messageReactionRemoveAll: Message;
  messageUpdate: [Message, Message];
  presenceUpdate: [GuildMember, GuildMember];
  ready: void;
  reconnecting: void;
  resume: number;
  roleCreate: Role;
  roleDelete: Role;
  roleUpdate: [Role, Role];
  typingStart: [Channel, User];
  typingStop: [Channel, User];
  userNoteUpdate: [UserResolvable, string, string];
  userUpdate: [User, User];
  voiceStateUpdate: [GuildMember, GuildMember];
  warn: string;
}
