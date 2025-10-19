import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  CommandInteraction,
} from "discord.js";

export const restartTaskInfo: ChatInputApplicationCommandData = {
  name: "restart_task",
  description: "前回のタスクを再開",
  type: ApplicationCommandType.ChatInput,
};

export const restartTask = async (
  interaction: CommandInteraction
): Promise<string> => {
  return "後で書く";
};
