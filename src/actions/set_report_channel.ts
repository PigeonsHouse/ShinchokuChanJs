import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
} from "discord.js";

export const setReportChannelInfo: ChatInputApplicationCommandData = {
  name: "set_report_channel",
  description: "月次報告を行うチャンネルを設定",
  type: ApplicationCommandType.ChatInput,
};

export const setReportChannel = async () => {};
