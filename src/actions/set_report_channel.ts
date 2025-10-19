import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  CommandInteraction,
} from "discord.js";
import db from "../db";
import { messages } from "../definitions";

export const setReportChannelInfo: ChatInputApplicationCommandData = {
  name: "set_report_channel",
  description: "月次報告を行うチャンネルを設定",
  type: ApplicationCommandType.ChatInput,
};

export const setReportChannel = async (
  interaction: CommandInteraction
): Promise<string> => {
  // === Validation ===
  // サーバー外(DMなど)では動作しないようにする
  if (!interaction.guild) return messages.common.denyDM;

  // === Preparation ===
  // DBにサーバーの情報がなければ追加
  const guildId = interaction.guild.id;
  await db.prepareGuild(guildId, interaction.guild.name);

  // === Action ===
  db.setNotifyChannel(guildId, interaction.channelId);
  return messages.setReportChannel.set;
};
