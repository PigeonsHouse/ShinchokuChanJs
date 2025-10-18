import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  CommandInteraction,
  Guild,
  User,
} from "discord.js";
import { getUserTask, removeUserTask } from "../redis";
import { messages } from "../definitions";
import { incrementTaskDuration, prepareGuildAndUser } from "../db";
import { convertDurationToString } from "../utils";

export const endTaskInfo: ChatInputApplicationCommandData = {
  name: "end_task",
  description: "作業時間の計測を終了",
  type: ApplicationCommandType.ChatInput,
};

export const endTaskForVoiceState = async (guild: Guild, user: User) => {
  const existingUserTask = await getUserTask(user.id);
  if (!existingUserTask) return;
  const replyChannel = await guild.channels.fetch(
    existingUserTask.replyChannelId
  );
  if (!replyChannel) return;
  const reply = async (content: string) => {
    if (replyChannel.isTextBased()) {
      await replyChannel.send(content);
    }
  };
  endTask({
    guild,
    user,
    reply,
    isCommand: false,
  });
};

export const endTaskForCommand = async (interaction: CommandInteraction) => {
  // === Validation ===
  // サーバー外(DMなど)では動作しないようにする
  if (!interaction.guild) return;
  interaction.user;
  endTask({
    guild: interaction.guild,
    user: interaction.user,
    reply: async (content) => {
      interaction.reply(content);
    },
    isCommand: true,
  });
};

type EndTaskProps = {
  guild: Guild;
  user: User;
  reply: (content: string) => Promise<void>;
  isCommand: boolean;
};

const endTask = async ({ guild, user, reply, isCommand }: EndTaskProps) => {
  // redisの作業中リストに既にいたら弾く
  const existingUserTask = await getUserTask(user.id);
  if (!existingUserTask) {
    if (isCommand) {
      await reply(messages.endTask.noWatchingTask);
    }
    return;
  }
  // コマンド実行時、VCに入っていなかったら弾く
  const userId = user.id;
  const member = await guild.members.fetch(userId);
  if (isCommand && member.voice.channel === null) {
    await reply(messages.endTask.notInVC);
    return;
  }

  // === Preparation ===
  // DBにユーザーとサーバーの情報がなければ追加
  await prepareGuildAndUser(guild.id, guild.name, userId, user.username);

  // === Main Process ===
  const duration = Date.now() - existingUserTask.startAt;
  await incrementTaskDuration(existingUserTask.taskId, duration);
  await removeUserTask(user.id);
  const taskName = existingUserTask.taskName;
  const durationString = convertDurationToString(duration);
  reply(messages.endTask.finished(taskName, durationString));
};
