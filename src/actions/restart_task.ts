import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
} from "discord.js";

export const restartTaskInfo: ChatInputApplicationCommandData = {
  name: "restart_task",
  description: "前回のタスクを再開",
  type: ApplicationCommandType.ChatInput,
};

export const restartTask = async () => {};
