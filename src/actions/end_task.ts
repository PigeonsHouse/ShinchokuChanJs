import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  CommandInteraction,
  Guild,
  User,
} from "discord.js";
import db from "../db";
import { messages } from "../definitions";
import redis, { UserTask } from "../redis";
import { convertDurationToString } from "../utils";

export const endTaskInfo: ChatInputApplicationCommandData = {
  name: "end_task",
  description: "作業時間の計測を終了",
  type: ApplicationCommandType.ChatInput,
};

export const endTaskForVoiceState = async (guild: Guild, user: User) => {
  const existingUserTask = await redis.getUserTask(user.id);
  if (!existingUserTask) return;
  const replyChannel = await guild.channels.fetch(
    existingUserTask.replyChannelId
  );
  if (!replyChannel) return;
  const message = await endTask({
    guild,
    user,
    existingUserTask,
  });
  if (replyChannel.isTextBased()) {
    await replyChannel.send(message);
  }
};

export const endTaskForCommand = async (
  interaction: CommandInteraction
): Promise<string> => {
  // === Validation ===
  // サーバー外(DMなど)では動作しないようにする
  if (!interaction.guild) return messages.common.denyDM;
  // redisの作業中リストに既にいたら弾く
  const userId = interaction.user.id;
  const existingUserTask = await redis.getUserTask(userId);
  if (!existingUserTask) {
    return messages.endTask.noWatchingTask;
  }
  // コマンド実行時、VCに入っていなかったら弾く
  const member = await interaction.guild.members.fetch(userId);
  if (member.voice.channel === null) {
    return messages.endTask.notInVC;
  }

  return await endTask({
    guild: interaction.guild,
    user: interaction.user,
    existingUserTask,
  });
};

type EndTaskProps = {
  guild: Guild;
  user: User;
  existingUserTask: UserTask;
};

const endTask = async ({
  guild,
  user,
  existingUserTask,
}: EndTaskProps): Promise<string> => {
  // === Preparation ===
  // DBにユーザーとサーバーの情報がなければ追加
  await db.prepareGuildAndUser(guild.id, guild.name, user.id, user.username);

  // === Main Process ===
  const duration = Date.now() - existingUserTask.startAt;
  await db.incrementTaskDuration(existingUserTask.taskId, duration);
  await db.setLastTaskId(user.id, existingUserTask.taskId);
  await redis.removeUserTask(user.id);
  const taskName = existingUserTask.taskName;
  const durationString = convertDurationToString(duration);
  return messages.endTask.finished(taskName, durationString);
};
