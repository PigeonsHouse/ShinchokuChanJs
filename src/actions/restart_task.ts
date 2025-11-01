import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  CommandInteraction,
} from "discord.js";
import db from "../db";
import { messages } from "../definitions";
import redis from "../redis";

export const restartTaskInfo: ChatInputApplicationCommandData = {
  name: "restart_task",
  description: "前回のタスクを再開",
  type: ApplicationCommandType.ChatInput,
};

export const restartTask = async (
  interaction: CommandInteraction
): Promise<string> => {
  // === Validation ===
  // サーバー外(DMなど)では動作しないようにする
  if (!interaction.guild) return messages.common.denyDM;
  // redisの作業中リストに既にいたら弾く
  const existingUserTask = await redis.getUserTask(interaction.user.id);
  if (existingUserTask) {
    return messages.restartTask.alreadySameTask(existingUserTask.taskName);
  }
  // VCに入っていなかったら弾く
  const userId = interaction.user.id;
  const voiceState = await interaction.guild.voiceStates.fetch(userId);
  if (!voiceState.member) {
    return messages.common.notInVC;
  }
  // 直近タスクを取得
  const lastTask = await db.getLastTask(userId);
  if (!lastTask) {
    return messages.restartTask.noTask;
  }

  // === Preparation ===
  // DBにユーザーとサーバーの情報がなければ追加
  await db.prepareGuildAndUser(
    interaction.guild.id,
    interaction.guild.name,
    userId,
    interaction.user.username
  );

  // === Main Process ===
  // 報告済みの場合は同じ名前で新規タスクを作成
  let taskId: number;
  const taskName = lastTask.taskName;

  if (lastTask.isReported) {
    const existingTask = await db.getTaskByUserIdAndName(userId, taskName);
    if (existingTask) {
      taskId = existingTask.taskId;
    } else {
      const newTask = await db.addNewTask(userId, taskName);
      taskId = newTask.taskId;
    }
  } else {
    taskId = lastTask.taskId;
  }

  // redisの作業中リストに追加
  redis.addUserTask(userId, {
    userName: interaction.user.username,
    startAt: Date.now(),
    taskId,
    taskName,
    replyChannelId: interaction.channelId,
  });

  // 返信
  return messages.restartTask.restart(taskName);
};
