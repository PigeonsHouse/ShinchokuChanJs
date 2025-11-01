import { Client, CommandInteraction } from "discord.js";
import {
  endTaskForCommand,
  endTaskForVoiceState,
  endTaskInfo,
  report,
  restartTask,
  restartTaskInfo,
  setReportChannel,
  setReportChannelInfo,
  scheduleReport,
  startTask,
  startTaskInfo,
} from "./actions";

export const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
});

client.once("clientReady", async () => {
  console.log("Bot is online!");
  await client.application?.commands.set([
    startTaskInfo,
    restartTaskInfo,
    endTaskInfo,
    setReportChannelInfo,
  ]);
  await scheduleReport(client);
});

client.on("voiceStateUpdate", (_, newState) => {
  const isExitVoiceChannel = newState.channelId === null;
  if (!isExitVoiceChannel) return;
  if (!newState.member) return;

  endTaskForVoiceState(newState.guild, newState.member.user);
});

const commandHandlers: Record<
  string,
  (interaction: CommandInteraction) => Promise<string>
> = {
  [startTaskInfo.name]: startTask,
  [restartTaskInfo.name]: restartTask,
  [endTaskInfo.name]: endTaskForCommand,
  [setReportChannelInfo.name]: setReportChannel,
};

client.on("interactionCreate", async (interaction) => {
  // Command 以外は無視
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const handler = commandHandlers[commandName];
  const message = handler ? await handler(interaction) : "後で書く";
  interaction.reply(message);
});

// デバッグ用コマンド処理
client.on("messageCreate", async (message) => {
  if (message.author.id !== process.env.OWNER_ID) return;
  switch (message.content) {
    case "ping":
      message.reply("pong");
      break;
    case "debug_report":
      await report(client);
      message.reply("報告処理を実行しました");
      break;
    default:
      break;
  }
});
