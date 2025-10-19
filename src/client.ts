import { Client, CommandInteraction, Routes } from "discord.js";
import {
  endTaskInfo,
  startTask,
  startTaskInfo,
  setReportChannel,
  setReportChannelInfo,
  restartTaskInfo,
  restartTask,
  endTaskForCommand,
  endTaskForVoiceState,
  scheduleReport,
} from "./actions";

export const client = new Client({ intents: ["Guilds", "GuildVoiceStates"] });

client.once("clientReady", async () => {
  console.log("Bot is online!");
  await client.application?.commands.set([
    startTaskInfo,
    restartTaskInfo,
    endTaskInfo,
    setReportChannelInfo,
  ]);
  await scheduleReport();
  // const guilds = await client.guilds.fetch();
  // guilds.forEach(async (guild) => {
  //   await registerCommands(guild.id);
  // });
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

// export const registerCommands = async (guildId: string) => {
//   await client.rest.put(
//     Routes.applicationGuildCommands(process.env.APPLICATION_ID!, guildId),
//     {
//       body: [startTaskInfo, restartTaskInfo, endTaskInfo, setReportChannelInfo],
//     }
//   );
// };
