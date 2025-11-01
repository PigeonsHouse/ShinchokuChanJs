import { Client } from "discord.js";
import cron from "node-cron";
import db from "../db";
import { messages } from "../definitions";
import redis from "../redis";
import { convertDurationToString, mentionUser } from "../utils";

export const scheduleReport = async (client: Client) => {
  // 毎月1日の0時0分に実行
  cron.schedule("0 0 1 * *", () => report(client));
};

export const report = async (client: Client) => {
  // 報告中に作業中のユーザがいた場合の一時終了時刻と再開時刻の調整のための現在時刻
  const now = Date.now();

  // 作業中ユーザのタスク時間をDBに反映
  const allUserTasks = await redis.getAllUserTasks();
  for (const [, userTask] of Object.entries(allUserTasks)) {
    const duration = now - userTask.startAt;
    db.incrementTaskDuration(userTask.taskId, duration);
  }

  // 各ギルドの報告チャンネルに報告を送る
  const guild_list = await db.getGuildList();
  for (const guild of guild_list) {
    // 進捗ちゃんが参加しているサーバーの報告用チャンネルを取得
    let notifyChannelId: string | null = guild.notifyChannelId;
    if (!guild.notifyChannelId) {
      // DBに保存されていない場合はシステムチャンネルを使う
      notifyChannelId =
        client.guilds.cache.get(guild.guildId)?.systemChannelId || null;
    }
    // それでも報告チャンネルがなければスキップ
    if (!notifyChannelId) {
      continue;
    }
    // メッセージを送れるチャンネルが存在するか確認
    const notifyChannel = await client.channels.fetch(notifyChannelId);
    if (!notifyChannel || !notifyChannel.isSendable()) {
      continue;
    }

    // 報告メッセージの作成
    let reportMessage = "";
    // ギルド全体のタスクを一括取得（ユーザー情報も含む）
    const allTasksInGuild = await db.getTaskListByGuild(guild.guildId);

    // ユーザーごとにグループ化
    // keyがユーザーID、valueがそのユーザーのタスクの配列になっているハッシュマップ
    const tasksByUser = new Map<string, typeof allTasksInGuild>();
    for (const task of allTasksInGuild) {
      const userId = task.userId;
      if (!tasksByUser.has(userId)) {
        tasksByUser.set(userId, []);
      }
      tasksByUser.get(userId)!.push(task);
    }

    // ユーザーごとにレポートメッセージを生成
    for (const [userId, taskList] of tasksByUser) {
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
      notifyChannel.send(messages.report.startMessage);
      notifyChannel.send(reportMessage);
    }
  }

  // 報告を終えたのでTask.isReportedをtrueに更新
  await db.updateTasksReported();

  // 作業中ユーザのタスクも完了しているので、新しいタスクを一括で作成
  const tasksToCreate = Object.entries(allUserTasks).map(
    ([userId, userTask]) => ({
      userId,
      taskName: userTask.taskName,
    })
  );
  if (tasksToCreate.length > 0) {
    const createdTasks = await db.addNewTasksBulk(tasksToCreate);
    // 作成されたタスクをRedisに反映
    for (const createdTask of createdTasks) {
      const userTask = allUserTasks[createdTask.userId];
      await redis.addUserTask(createdTask.userId, {
        ...userTask,
        taskId: createdTask.taskId,
        startAt: now,
      });
    }
  }
};
