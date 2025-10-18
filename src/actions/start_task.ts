import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type ChatInputApplicationCommandData,
  CommandInteraction,
} from "discord.js";
import { addNewTask, getTaskByUserIdAndName, prepareGuildAndUser } from "../db";
import { addUserTask, getUserTask } from "../redis";
import { messages } from "../definitions";

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

export const startTask = async (interaction: CommandInteraction) => {
  // === Validation ===
  // 引数を受け取るのでChatInputCommandであることを保証
  if (!interaction.isChatInputCommand()) return;
  // サーバー外(DMなど)では動作しないようにする
  if (!interaction.guild) return;
  // 引数受け取り
  const taskName = interaction.options.getString(
    // 必須なのでnot-nullアサーションOK
    startTaskInfo.options![0]!.name
  );
  if (!taskName) {
    await interaction.reply(messages.startTask.noTaskName);
    return;
  }
  if (taskName.length > 125) {
    await interaction.reply(messages.startTask.taskNameTooLong);
    return;
  }
  // redisの作業中リストに既にいたら弾く
  const existingUserTask = await getUserTask(interaction.user.id);
  if (existingUserTask) {
    const isSameTask = existingUserTask.taskName === taskName;
    let message: string;
    if (isSameTask) {
      message = messages.startTask.alreadySameTask(taskName);
    } else {
      message = messages.startTask.alreadyDifferentTask;
    }
    await interaction.reply(message);
    return;
  }
  // VCに入っていなかったら弾く
  const userId = interaction.user.id;
  console.log(`[DEBUG] Checking VC status for user: ${userId}`);

  const voiceState = await interaction.guild.voiceStates.fetch(userId);
  if (!voiceState.member) {
    console.log(`[DEBUG] User ${userId} is not in VC - rejecting`);
    await interaction.reply(messages.startTask.notInVC);
    return;
  }

  // === Preparation ===
  // DBにユーザーとサーバーの情報がなければ追加
  await prepareGuildAndUser(
    interaction.guild.id,
    interaction.guild.name,
    userId,
    interaction.user.username
  );

  // === Main Process ===
  // タスクがなければ新規作成、あればそれを使う
  const existingTask = await getTaskByUserIdAndName(userId, taskName);
  let taskId: number;
  if (existingTask) {
    taskId = existingTask.taskId;
  } else {
    const newTask = await addNewTask(userId, taskName);
    taskId = newTask.taskId;
  }

  // redisの作業中リストに追加
  addUserTask(userId, {
    userName: interaction.user.username,
    startAt: Date.now(),
    taskId,
    taskName,
    replyChannelId: interaction.channelId,
  });

  // 返信
  await interaction.reply(messages.startTask.start(taskName));
};
