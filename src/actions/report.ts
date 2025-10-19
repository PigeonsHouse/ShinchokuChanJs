import cron from "node-cron";
import db from "../db";
import redis from "../redis";
import { Client } from "discord.js";
import { messages } from "../definitions";
import { convertDurationToString, mentionUser } from "../utils";

export const scheduleReport = async (client: Client) => {
  // 毎月1日の0時0分に実行
  cron.schedule("0 0 1 * *", () => report(client));
};

export const report = async (client: Client) => {
  console.log("[DEBUG] Starting monthly report generation");
  const now = Date.now();

  const allUserTasks = await redis.getAllUserTasks();
  console.log(
    `[DEBUG] Found ${Object.keys(allUserTasks).length} active user tasks`
  );

  for (const [, userTask] of Object.entries(allUserTasks)) {
    const duration = now - userTask.startAt;
    console.log(
      `[DEBUG] Updating task: ${userTask.taskName} for user: ${userTask.userName}, duration: ${duration}ms`
    );
    db.incrementTaskDuration(userTask.taskId, duration);
  }

  // ここで各ギルドの報告チャンネルに報告を送る処理を書く
  const guild_list = await db.getGuildList();
  console.log(`[DEBUG] Processing ${guild_list.length} guilds`);

  for (const guild of guild_list) {
    console.log(`[DEBUG] Processing guild: ${guild.guildId}`);
    // 進捗ちゃんが参加しているサーバーの報告用チャンネルを取得
    let notifyChannelId: string | null = guild.notifyChannelId;
    if (!guild.notifyChannelId) {
      // DBに保存されていない場合はシステムチャンネルを使う
      notifyChannelId =
        client.guilds.cache.get(guild.guildId)?.systemChannelId || null;
      console.log(
        `[DEBUG] No notify channel set, using system channel: ${notifyChannelId}`
      );
    }
    // それでも報告チャンネルがなければスキップ
    if (!notifyChannelId) {
      console.log(
        `[DEBUG] No notify channel found for guild ${guild.guildId}, skipping`
      );
      continue;
    }
    // メッセージを送れるチャンネルが存在するか確認
    const notifyChannel = await client.channels.fetch(notifyChannelId);
    if (!notifyChannel || !notifyChannel.isSendable()) {
      console.log(
        `[DEBUG] Channel ${notifyChannelId} is not sendable, skipping`
      );
      continue;
    }
    console.log(`[DEBUG] Using notify channel: ${notifyChannelId}`);

    // 報告メッセージの作成
    let reportMessage = "";
    const joiningUserList = await db.getJoiningUser(guild.guildId);
    console.log(
      `[DEBUG] Found ${joiningUserList.length} users in guild ${guild.guildId}`
    );

    for (const joining of joiningUserList) {
      const userId = joining.userId;
      // TODO: n+1なので修正したい
      const taskList = await db.getTaskList(userId);
      console.log(`[DEBUG] User ${userId} has ${taskList.length} tasks`);
      if (taskList.length <= 0) continue;
      reportMessage += `${mentionUser(userId)}さん\n`;
      // タスク一覧から以下のようなフォーマットのタスク情報のメッセージに変換
      // 【ゲーム開発】1:34:45
      const taskMessages = taskList.map(
        (task) =>
          `【${task.taskName}】${convertDurationToString(task.duration)}`
      );
      reportMessage += taskMessages.join("\n");
      reportMessage += "\n\n";
    }
    // 末尾に改行がついているはずなので、stripで安全に落とす
    reportMessage = reportMessage.trim();
    if (reportMessage.length > 0) {
      console.log(
        `[DEBUG] Sending report message to channel ${notifyChannelId}`
      );
      notifyChannel.send(messages.report.startMessage);
      notifyChannel.send(reportMessage);
    } else {
      console.log(
        `[DEBUG] No report message to send for guild ${guild.guildId}`
      );
    }
  }

  console.log("[DEBUG] Updating tasks as reported");
  await db.updateTasksReported();

  console.log("[DEBUG] Creating new tasks for next period");
  for (const [, userTask] of Object.entries(allUserTasks)) {
    // TODO: n+1になっている
    console.log(
      `[DEBUG] Updating task start time and creating new task for user: ${userTask.userName}`
    );
    redis.updateUserTasksStartAt(userTask.userName, now);
    db.addNewTask(userTask.userName, userTask.taskName);
  }

  console.log("[DEBUG] Monthly report generation completed");
};
