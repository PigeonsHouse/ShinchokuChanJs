import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  CommandInteraction,
  type ChatInputApplicationCommandData,
} from "discord.js";
import db from "../db";
import { messages } from "../definitions";
import redis from "../redis";

export const startTaskInfo: ChatInputApplicationCommandData = {
  name: "start_task",
  description: "作業時間の計測を開始(VCを抜けると計測終了)",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "task_name",
      description: "作業するタスクの名前",
      required: true,
    },
  ],
};

export const startTask = async (
  interaction: CommandInteraction
): Promise<string> => {
  // === Validation ===
  // 引数を受け取るのでChatInputCommandであることを保証
  if (!interaction.isChatInputCommand()) return messages.startTask.noTaskName;
  // サーバー外(DMなど)では動作しないようにする
  if (!interaction.guild) return messages.common.denyDM;
  // 引数受け取り
  const taskName = interaction.options.getString(
    // 必須なのでnot-nullアサーションOK
    startTaskInfo.options![0]!.name
  );
  if (!taskName) {
    return messages.startTask.noTaskName;
  }
  if (taskName.length > 125) {
    return messages.startTask.taskNameTooLong;
  }
  // redisの作業中リストに既にいたら弾く
  const existingUserTask = await redis.getUserTask(interaction.user.id);
  if (existingUserTask) {
    const isSameTask = existingUserTask.taskName === taskName;
    let message: string;
    if (isSameTask) {
      message = messages.startTask.alreadySameTask(taskName);
    } else {
      message = messages.startTask.alreadyDifferentTask;
    }
    return message;
  }
  // VCに入っていなかったら弾く
  const userId = interaction.user.id;
  const voiceState = await interaction.guild.voiceStates.fetch(userId);
  if (!voiceState.member) {
    return messages.common.notInVC;
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
  // タスクがなければ新規作成、あればそれを使う
  const existingTask = await db.getTaskByUserIdAndName(userId, taskName);
  let taskId: number;
  if (existingTask) {
    taskId = existingTask.taskId;
  } else {
    const newTask = await db.addNewTask(userId, taskName);
    taskId = newTask.taskId;
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
  return messages.startTask.start(taskName);
};
